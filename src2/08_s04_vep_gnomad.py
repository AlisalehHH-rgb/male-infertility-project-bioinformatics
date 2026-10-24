# Extracted verbatim from notebooks/Final_Organized_A_full_rerun.ipynb (cell 17): S04 - Ensembl VEP + gnomAD v4
# Requires the setup step (00) to have set PROJECT_BASE and RAW_DIR environment variables.
# =============================================================================
# STAGE 4 (v2) - Ensembl VEP REST + gnomAD v4, real data only.
# ALL outputs go to folders ending in _v2. previous-run folders (final/Stage_4 ...)
# are never written to. The ClinVar input is READ ONLY.
# Paste into ONE Colab cell.
# =============================================================================
import os, json, time, hashlib, shutil, requests
import numpy as np
import pandas as pd
from datetime import datetime

from google.colab import drive
if not os.path.exists('/content/drive/MyDrive'):
    drive.mount('/content/drive')

BASE = os.environ['PROJECT_BASE']
IN_CLINVAR = f'{BASE}/final/S02_ClinVar/clinvar_P_LP_GRCh38.csv'   # READ ONLY (written by S02 - ClinVar above)
OUT = f'{BASE}/final/S04_VEP_gnomAD'                                 # every output goes here
CACHE = os.environ['RAW_DIR'] + '/vep_v2'                                     # raw API responses (resume-able)
assert OUT.startswith(BASE) and CACHE.startswith(BASE), 'Safety: outputs must stay inside PROJECT_BASE'
os.makedirs(OUT, exist_ok=True); os.makedirs(CACHE, exist_ok=True)

TODAY = datetime.now().strftime('%Y-%m-%d')
NA = 'Not available'
RUN_GNOMAD = True          # set False to skip the gnomAD step (columns become 'not_queried')
BATCH = 50                 # Ensembl allows up to 200 per POST; smaller is safer

# ------------------------------- helpers -------------------------------------
def num(x):
    try:
        return float(x)
    except Exception:
        return np.nan

def pick_tc(item, gene):
    """Choose ONE transcript consequence: MANE Select > Ensembl canonical > first,
    restricted to transcripts whose gene_symbol equals the ClinVar gene."""
    tcs = item.get('transcript_consequences') or []
    if not tcs:
        return None, 'no_transcript_consequences'
    same = [t for t in tcs if t.get('gene_symbol') == gene]
    pool, gm = (same, 'gene_symbol_match') if same else (tcs, 'GENE_SYMBOL_MISMATCH')
    for key, label in (('mane_select', 'MANE_Select'), ('canonical', 'Ensembl_canonical')):
        c = [t for t in pool if t.get(key)]
        if c:
            return c[0], f'{label}|{gm}'
    return pool[0], f'first_transcript|{gm}'

def extract(item, tc, how):
    f = {'VEP_most_severe_consequence': item.get('most_severe_consequence', NA),
         'VEP_assembly': item.get('assembly_name', NA),
         'VEP_allele_string': item.get('allele_string', NA),
         'Transcript_choice': how}
    if tc is None:
        return f
    f.update({'Transcript_ID': tc.get('transcript_id', NA),
              'VEP_gene_symbol': tc.get('gene_symbol', NA),
              'Biotype': tc.get('biotype', NA),
              'Consequence_terms': ','.join(tc.get('consequence_terms', [])) or NA,
              'Impact': tc.get('impact', NA),
              'HGVSc': tc.get('hgvsc', NA), 'HGVSp': tc.get('hgvsp', NA),
              'CADD_PHRED': num(tc.get('cadd_phred')), 'CADD_RAW': num(tc.get('cadd_raw')),
              'LoF': tc.get('lof', NA), 'LoF_filter': tc.get('lof_filter', NA),
              'LoF_flags': tc.get('lof_flags', NA)})
    am = tc.get('alphamissense')
    if isinstance(am, dict):
        f['AM_class'] = am.get('am_class', NA); f['AM_pathogenicity'] = num(am.get('am_pathogenicity'))
    else:
        f['AM_class'] = tc.get('am_class', NA); f['AM_pathogenicity'] = num(tc.get('am_pathogenicity'))
    sp = tc.get('spliceai')
    ds = [num(v) for k, v in sp.items() if str(k).upper().startswith('DS_')] if isinstance(sp, dict) else []
    f['SpliceAI_max_DS'] = max([d for d in ds if d == d], default=np.nan)
    f['Chosen_transcript_json'] = json.dumps(tc)
    return f
# ----------------------------- end helpers -----------------------------------

# 1. Load input (read-only) and keep a snapshot inside the v2 folder
if not os.path.exists(IN_CLINVAR):
    raise FileNotFoundError(f'Missing {IN_CLINVAR}. Upload clinvar_P_LP_GRCh38.csv there (or edit IN_CLINVAR).')
df = pd.read_csv(IN_CLINVAR)
shutil.copy(IN_CLINVAR, f'{OUT}/input_clinvar_P_LP_snapshot.csv')
in_sha = hashlib.sha256(open(IN_CLINVAR, 'rb').read()).hexdigest()
print(f'Input rows: {len(df)} | SHA256: {in_sha[:16]}...')

ok_allele = df['REF'].astype(str).str.fullmatch('[ACGT]+') & df['ALT'].astype(str).str.fullmatch('[ACGT]+')
valid = ok_allele & (df['Position_GRCh38'] > 0)
print(f'Variants WITHOUT usable GRCh38 coordinates/alleles (excluded, not guessed): {int((~valid).sum())}')
print(df[~valid][['Variation_ID', 'Gene', 'Position_GRCh38', 'REF', 'ALT']].to_string(index=False))

dv = df[valid].copy()
dv['vep_in'] = dv.apply(lambda r: f"{r['Chr']} {r['Position_GRCh38']} {r['Variation_ID']} {r['REF']} {r['ALT']} . . .", axis=1)
expected = set(dv['Variation_ID'].astype(str))
input_to_vid = {r['vep_in']: str(r['Variation_ID']) for _, r in dv.iterrows()}

# 2. Ensembl release + pilot: which optional annotations does the server accept?
SERVER, EP = 'https://rest.ensembl.org', '/vep/homo_sapiens/region'
HEAD = {'Content-Type': 'application/json', 'Accept': 'application/json'}
release = NA
try:
    release = requests.get(f'{SERVER}/info/data?content-type=application/json', timeout=30).json().get('releases')
except Exception as e:
    release = f'lookup failed: {type(e).__name__}'
print('Ensembl release(s):', release)

def vep_post(variants, params):
    url = SERVER + EP + '?' + '&'.join(f'{k}={v}' for k, v in params.items())
    err = 'unknown'
    for k in range(4):
        try:
            r = requests.post(url, headers=HEAD, data=json.dumps({'variants': variants}), timeout=240)
        except Exception as e:
            err = f'EXC {type(e).__name__}'; time.sleep(5 * (k + 1)); continue
        if r.status_code == 200:
            return r.json(), 200
        err = f'HTTP {r.status_code}: {r.text[:150]}'
        if r.status_code == 429:
            time.sleep(float(r.headers.get('Retry-After', 5 * (k + 1)))); continue
        if r.status_code in (500, 502, 503, 504):
            time.sleep(5 * (k + 1)); continue
        break
    return None, err

REQUIRED = {'hgvs': 1, 'canonical': 1, 'mane': 1}
OPTIONAL = {'CADD': 1, 'AlphaMissense': 1, 'SpliceAI': 1, 'LoF': 1}
snv = dv[(dv.REF.str.len() == 1) & (dv.ALT.str.len() == 1)].head(3)['vep_in'].tolist()
ind = dv[(dv.REF.str.len() > 1) | (dv.ALT.str.len() > 1)].head(2)['vep_in'].tolist()
pilot = snv + ind
PARAMS, dropped = dict(REQUIRED), {}
data, st = vep_post(pilot, REQUIRED)
if data is None:
    raise RuntimeError(f'Base VEP request failed, stopping (no fallback values): {st}')
for name, val in OPTIONAL.items():
    d, st = vep_post(pilot, {**REQUIRED, name: val})
    if d is None:
        dropped[name] = st
    else:
        PARAMS[name] = val
    time.sleep(1)
print('VEP parameters in use:', PARAMS)
print('Optional annotations the server REJECTED (will be Not available):', dropped if dropped else 'none')

# 3. Run all batches (cached, retried, recursively split on failure)
results, failures = {}, {}
def run_batch(rows):
    key = hashlib.md5(('|'.join(v for _, v in rows) + json.dumps(PARAMS, sort_keys=True)).encode()).hexdigest()
    path = f'{CACHE}/batch_{key}.json'
    if os.path.exists(path):
        data, status = json.load(open(path)), 200
    else:
        data, status = vep_post([v for _, v in rows], PARAMS)
        if data is not None:
            json.dump(data, open(path, 'w'))
        time.sleep(1)
    if data is None:
        if len(rows) == 1:
            failures[rows[0][0]] = status; return
        mid = len(rows) // 2
        run_batch(rows[:mid]); run_batch(rows[mid:]); return
    for item in data:
        vid = str(item.get('id'))
        if vid not in expected:
            vid = input_to_vid.get(item.get('input'), vid)
        results[vid] = item

rows_all = list(zip(dv['Variation_ID'].astype(str), dv['vep_in']))
for i in range(0, len(rows_all), BATCH):
    run_batch(rows_all[i:i + BATCH])
    print(f'  batches done: {min(i + BATCH, len(rows_all))}/{len(rows_all)} | annotated so far: {len(results)} | failed: {len(failures)}')
for vid in expected:
    if vid not in results and vid not in failures:
        failures[vid] = 'No result returned inside a 200 response'

# 4. gnomAD v4 allele frequencies via the gnomAD GraphQL API
GQL = 'https://gnomad.broadinstitute.org/api'
QUERY = 'query($id:String!){variant(variantId:$id,dataset:gnomad_r4){variant_id exome{ac an af} genome{ac an af}}}'
gcache_path = f'{CACHE}/gnomad_v4_cache.json'
gcache = json.load(open(gcache_path)) if os.path.exists(gcache_path) else {}

def gnomad(gid):
    for k in range(5):
        try:
            r = requests.post(GQL, json={'query': QUERY, 'variables': {'id': gid}}, timeout=60)
        except Exception:
            time.sleep(5 * (k + 1)); continue
        if r.status_code == 429:
            time.sleep(15 * (k + 1)); continue
        if r.status_code != 200:
            time.sleep(5 * (k + 1)); continue
        js = r.json()
        v = (js.get('data') or {}).get('variant')
        if v:
            ex, ge = v.get('exome') or {}, v.get('genome') or {}
            return {'status': 'found', 'ex_af': ex.get('af'), 'ex_ac': ex.get('ac'), 'ex_an': ex.get('an'),
                    'ge_af': ge.get('af'), 'ge_ac': ge.get('ac'), 'ge_an': ge.get('an')}
        msgs = ' '.join(e.get('message', '') for e in (js.get('errors') or [])).lower()
        if 'not found' in msgs or not js.get('errors'):
            return {'status': 'not_in_gnomad_v4'}
        time.sleep(5 * (k + 1))
    return {'status': 'query_failed'}

if RUN_GNOMAD:
    todo = [r for _, r in dv.iterrows() if str(r['Variation_ID']) in results]
    for n, r in enumerate(todo, 1):
        gid = f"{r['Chr']}-{r['Position_GRCh38']}-{r['REF']}-{r['ALT']}"
        if gid not in gcache or gcache[gid].get('status') == 'query_failed':
            gcache[gid] = gnomad(gid); time.sleep(0.8)
        if n % 25 == 0:
            json.dump(gcache, open(gcache_path, 'w')); print(f'  gnomAD: {n}/{len(todo)}')
    json.dump(gcache, open(gcache_path, 'w'))

# 5. Assemble one row per ORIGINAL variant (all input variants kept, with an explicit status)
out_rows = []
for _, r in df.iterrows():
    vid = str(r['Variation_ID'])
    row = {c: r[c] for c in ['Variation_ID', 'Gene', 'Chr', 'Position_GRCh38', 'REF', 'ALT', 'CLNSIG']}
    if not valid[_]:
        row['Annotation_status'] = 'EXCLUDED: no GRCh38 VCF coordinates/alleles in ClinVar input'
    elif vid in failures:
        row['Annotation_status'] = f'VEP_FAILED: {failures[vid]}'
    else:
        tc, how = pick_tc(results[vid], r['Gene'])
        row.update(extract(results[vid], tc, how))
        row['Annotation_status'] = 'annotated'
        gid = f"{r['Chr']}-{r['Position_GRCh38']}-{r['REF']}-{r['ALT']}"
        g = gcache.get(gid) if RUN_GNOMAD else None
        if g is None:
            row['gnomAD_status'] = 'not_queried'
        else:
            row['gnomAD_status'] = g['status']
            if g['status'] == 'found':
                row.update({'gnomAD_exome_AF': num(g['ex_af']), 'gnomAD_exome_AC': g['ex_ac'], 'gnomAD_exome_AN': g['ex_an'],
                            'gnomAD_genome_AF': num(g['ge_af']), 'gnomAD_genome_AC': g['ge_ac'], 'gnomAD_genome_AN': g['ge_an']})
                afs = [x for x in (num(g['ex_af']), num(g['ge_af'])) if x == x]
                row['gnomAD_max_AF'] = max(afs) if afs else np.nan
    out_rows.append(row)
res = pd.DataFrame(out_rows)

# 6. Save
res.to_csv(f'{OUT}/vep_annotation_v2.csv', index=False)
res[res['Annotation_status'] != 'annotated'][['Variation_ID', 'Gene', 'Annotation_status']].to_csv(f'{OUT}/vep_failures_v2.csv', index=False)
with open(f'{OUT}/vep_provenance_v2.json', 'w') as f:
    json.dump({'access_date': TODAY, 'ensembl_release': release, 'endpoint': SERVER + EP,
               'params_used': PARAMS, 'optional_params_rejected': dropped,
               'input_file': IN_CLINVAR, 'input_sha256': in_sha, 'input_rows': int(len(df)),
               'gnomad_api': GQL, 'gnomad_dataset': 'gnomad_r4' if RUN_GNOMAD else 'not queried',
               'raw_cache': CACHE, 'note': 'Input is read-only; outputs only in *_v2 folders.'}, f, indent=2, default=str)

# 7. Report
ann = res[res['Annotation_status'] == 'annotated']
print('\n================ REPORT ================')
print(f'Total input variants: {len(res)} | annotated: {len(ann)} | not annotated: {len(res) - len(ann)}')
print(res['Annotation_status'].str.split(':').str[0].value_counts().to_dict())
print('Assembly values:', ann['VEP_assembly'].value_counts().to_dict())
print('Transcript choice:', ann['Transcript_choice'].value_counts().to_dict())
for c in ['CADD_PHRED', 'AM_pathogenicity', 'SpliceAI_max_DS']:
    if c in ann:
        print(f'{c}: non-missing {int(ann[c].notna().sum())}/{len(ann)}')
if 'LoF' in ann:
    print('LoF values:', ann['LoF'].value_counts().to_dict())
if 'gnomAD_status' in ann:
    print('gnomAD status:', ann['gnomAD_status'].value_counts().to_dict())
print('Most severe consequence (top 12):', ann['VEP_most_severe_consequence'].value_counts().head(12).to_dict())
cov = res.groupby('Gene').agg(Total=('Variation_ID', 'count'),
                               Annotated=('Annotation_status', lambda s: int((s == 'annotated').sum())))
if 'CADD_PHRED' in res:
    cov['With_CADD'] = res.groupby('Gene')['CADD_PHRED'].apply(lambda s: int(s.notna().sum()))
if 'gnomAD_status' in res:
    cov['gnomAD_found'] = res.groupby('Gene')['gnomAD_status'].apply(lambda s: int((s == 'found').sum()))
print('\nPer-gene coverage:\n', cov.to_string())

# Optional cross-check against previous-run set of 12 variants (read only)
old = f'{BASE}/final/Stage_5/final_prioritized_variants.csv'   # legacy optional cross-check; folder absent here -> skipped
if os.path.exists(old):
    o = pd.read_csv(old)[['Gene', 'Variation_ID', 'HGVSC']]
    m = o.merge(res[['Variation_ID', 'HGVSc']], on='Variation_ID', how='left')
    cpart = lambda s: str(s).split(':')[-1]
    m['c_dot_matches'] = m['HGVSC'].map(cpart) == m['HGVSc'].map(cpart)
    print('\nCross-check vs previous Stage_5 (c. part of HGVS):\n', m.to_string(index=False))
print(f'\nFiles written to: {OUT}')
