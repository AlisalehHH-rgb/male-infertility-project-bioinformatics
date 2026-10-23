# Extracted verbatim from notebooks/Final_Organized_A_full_rerun.ipynb (cell 23): S07 - Human Protein Atlas
# Requires the setup step (00) to have set PROJECT_BASE and RAW_DIR environment variables.
# =============================================================================
# STAGE 7 (v2) - Human Protein Atlas, real per-gene data only.
# RULES: no templates, no assumed enrichment. Every value comes from the gene's
# own HPA entry (.json / .xml). Missing -> "Not available". Raw files are kept.
# Paste into ONE Colab cell.
# =============================================================================
import os, json, time, hashlib, requests
import pandas as pd
import xml.etree.ElementTree as ET
from datetime import datetime

from google.colab import drive
if not os.path.exists('/content/drive/MyDrive'):
    drive.mount('/content/drive')

BASE = os.environ['PROJECT_BASE']
RAWDIR = os.environ['RAW_DIR'] + '/hpa'
OUT = f'{BASE}/final/S07_HPA'
os.makedirs(RAWDIR, exist_ok=True); os.makedirs(OUT, exist_ok=True)
TODAY = datetime.now().strftime('%Y-%m-%d')
HEAD = {'User-Agent': 'Mozilla/5.0 (academic thesis research script)'}
NA = 'Not available'

# 1. Genes + Ensembl IDs come from the verified GTEx v2 table (IDs matched Ensembl REST)
gtex_path = f'{BASE}/final/S06_GTEx/gtex_tissue_expression_v2.csv'
if not os.path.exists(gtex_path):
    raise RuntimeError(f'Missing {gtex_path}. Run the GTEx v2 cell first.')
g = pd.read_csv(gtex_path)
g = g[g['Status'] == 'OK'][['Gene', 'Ensembl_Gene_ID']].copy()
g['ENSG'] = g['Ensembl_Gene_ID'].str.split('.').str[0]
print(f'Genes: {len(g)}')

# 2. Download raw JSON + XML per gene (cached on Drive, kept as evidence)
def fetch(url, path):
    if os.path.exists(path) and os.path.getsize(path) > 200:
        return open(path, 'rb').read(), 'cached', 200
    last = None
    for k in range(3):
        try:
            r = requests.get(url, headers=HEAD, timeout=90)
            last = r.status_code
            if r.status_code == 200 and len(r.content) > 200:
                open(path, 'wb').write(r.content)
                return r.content, 'downloaded', 200
            if r.status_code == 404:
                break
        except Exception as e:
            last = f'ERR {type(e).__name__}'
        time.sleep(3 * (k + 1))
    return None, 'failed', last

# 3. Helpers
def jget(d, *cands):
    low = {k.lower(): k for k in d}
    for c in cands:
        if c.lower() in low:
            return d[low[c.lower()]]
    for c in cands:
        for lk, k in low.items():
            if c.lower() in lk:
                return d[k]
    return None

def tostr(v):
    if v is None or v == '' or v == []:
        return NA
    return json.dumps(v, ensure_ascii=False) if isinstance(v, (dict, list)) else str(v)

def strip(tag): return tag.split('}')[-1]
def kids(el, name): return [c for c in el if strip(c.tag) == name]
def ktext(el, name):
    k = kids(el, name)
    return (k[0].text or '').strip() if k else ''

RANK = {'not detected': 0, 'low': 1, 'medium': 2, 'high': 3}

def parse_te(te):
    """tissueExpression -> list of (tissue, cellType, [(leveltype, level), ...])"""
    out = []
    for data in te.iter():
        if strip(data.tag) != 'data':
            continue
        tissue = ktext(data, 'tissue')
        if not tissue:
            continue
        cells = kids(data, 'tissueCell')
        if not cells:
            lv = [(l.get('type', ''), (l.text or '').strip()) for l in kids(data, 'level')]
            out.append((tissue, '', lv))
        for tc in cells:
            lv = [(l.get('type', ''), (l.text or '').strip()) for l in kids(tc, 'level')]
            out.append((tissue, ktext(tc, 'cellType'), lv))
    return out

def max_rank(levels):
    r = [RANK.get(t.lower(), -1) for _, t in levels]
    return max(r) if r else -1

def parse_xml(xml_bytes):
    root = ET.fromstring(xml_bytes)
    ab_of = {}
    abs_ = [e for e in root.iter() if strip(e.tag) == 'antibody']
    for ab in abs_:
        for te in ab.iter():
            if strip(te.tag) == 'tissueExpression':
                ab_of[id(te)] = ab.get('id') or 'unknown'
    entry_recs, ab_recs, te_attrs = [], {}, set()
    for te in root.iter():
        if strip(te.tag) != 'tissueExpression':
            continue
        te_attrs.add(tuple(sorted(te.attrib.items())))
        recs = parse_te(te)
        if id(te) in ab_of:
            ab_recs.setdefault(ab_of[id(te)], []).extend(recs)
        else:
            entry_recs.extend(recs)
    return root, [a.get('id') for a in abs_ if a.get('id')], entry_recs, ab_recs, te_attrs

def fmt(recs, tissue):
    seen, parts = set(), []
    for t, c, lv in recs:
        if t.lower() == tissue:
            s = f"{c or 'tissue-level'}=" + ','.join(f'{a}:{b}' for a, b in lv)
            if s not in seen:
                seen.add(s); parts.append(s)
    return '; '.join(parts) if parts else NA

# 4. Per-gene extraction
rows, prov, diag = [], {}, {}
for _, r in g.iterrows():
    gene, ensg = r['Gene'], r['ENSG']
    jurl, xurl = f'https://www.proteinatlas.org/{ensg}.json', f'https://www.proteinatlas.org/{ensg}.xml'
    jb, jst, jcode = fetch(jurl, f'{RAWDIR}/{ensg}.json')
    xb, xst, xcode = fetch(xurl, f'{RAWDIR}/{ensg}.xml')
    time.sleep(1)
    row = {'Gene': gene, 'Ensembl_Gene_ID': ensg, 'JSON_status': f'{jst} ({jcode})', 'XML_status': f'{xst} ({xcode})'}
    prov[gene] = {'json_url': jurl, 'xml_url': xurl, 'access_date': TODAY,
                  'json_sha256': hashlib.sha256(jb).hexdigest() if jb else NA,
                  'xml_sha256': hashlib.sha256(xb).hexdigest() if xb else NA}

    if jb:
        d = json.loads(jb.decode('utf-8'))
        if isinstance(d, list):
            d = d[0] if d else {}
        diag.setdefault('json_keys', sorted(d.keys()))
        row['HPA_Ensembl_in_entry'] = tostr(jget(d, 'Ensembl'))
        row['RNA_tissue_specificity'] = tostr(jget(d, 'RNA tissue specificity'))
        row['RNA_tissue_distribution'] = tostr(jget(d, 'RNA tissue distribution'))
        row['RNA_tissue_specific_nTPM'] = tostr(jget(d, 'RNA tissue specific nTPM'))
        row['SingleCell_type_specificity'] = tostr(jget(d, 'RNA single cell type specificity'))
        row['SingleCell_type_distribution'] = tostr(jget(d, 'RNA single cell type distribution'))
        row['SingleCell_type_specific_nTPM'] = tostr(jget(d, 'RNA single cell type specific nTPM'))
        row['IHC_reliability_JSON'] = tostr(jget(d, 'Reliability (IH)'))
        row['Antibody_JSON'] = tostr(jget(d, 'Antibody'))
    if xb:
        root, ab_ids, entry, abrecs, te_attrs = parse_xml(xb)
        diag.setdefault('xml_root_attrib', dict(root.attrib))
        diag.setdefault('tissueExpression_attribs', sorted(map(str, te_attrs))[:6])
        allrecs = entry + [x for v in abrecs.values() for x in v]
        base = entry if entry else allrecs
        tmax = {}
        for t, c, lv in base:
            tmax[t] = max(tmax.get(t, -1), max_rank(lv))
        row['Antibody_IDs_XML'] = ', '.join(ab_ids) if ab_ids else NA
        row['Testis_IHC_entry_level'] = fmt(entry, 'testis')
        row['Testis_IHC_by_antibody'] = ' | '.join(f'{a}: {fmt(v, "testis")}' for a, v in abrecs.items()
                                                    if fmt(v, 'testis') != NA) or NA
        inv = {v: k for k, v in RANK.items()}
        row['Testis_IHC_max_level'] = inv.get(tmax.get('testis', tmax.get('Testis', -1)), NA)
        row['Other_tissues_High'] = ', '.join(sorted(t for t, v in tmax.items() if v == 3 and t.lower() != 'testis')) or 'None'
        row['Other_tissues_Medium'] = ', '.join(sorted(t for t, v in tmax.items() if v == 2 and t.lower() != 'testis')) or 'None'
        row['n_tissues_in_XML'] = len(tmax)
    rows.append(row)

df = pd.DataFrame(rows).fillna(NA)
df['Source'] = 'Human Protein Atlas online release at access date; per-gene .json/.xml'
df['Access_date'] = TODAY

# 5. Save
df.to_csv(f'{OUT}/hpa_protein_expression_v2.csv', index=False)
with open(f'{OUT}/hpa_provenance_v2.json', 'w') as f:
    json.dump({'per_gene': prov, 'diagnostics': diag, 'note': 'Raw .json/.xml files kept in ' + RAWDIR}, f, indent=2, default=str)

# 6. Report (what worked, what did not, template check)
print('\n================ REPORT ================')
print('Download status:'); print(df[['Gene', 'JSON_status', 'XML_status']].to_string(index=False))
print('\nJSON keys found (first gene):', diag.get('json_keys'))
print('XML root attrib:', diag.get('xml_root_attrib'))
print('tissueExpression attribs:', diag.get('tissueExpression_attribs'))

print('\n--- Template check: columns with only ONE distinct value across genes ---')
for c in df.columns:
    if c in ('Gene', 'Ensembl_Gene_ID', 'Source', 'Access_date'):
        continue
    vals = df[c].astype(str).unique()
    if len(vals) == 1:
        print(f'  IDENTICAL for all genes -> {c}: {vals[0][:80]}')

na_cols = {c: int((df[c] == NA).sum()) for c in df.columns if (df[c] == NA).any()}
print('\nNot available counts per column:', na_cols)

show = ['Gene', 'RNA_tissue_specificity', 'Testis_IHC_max_level', 'IHC_reliability_JSON']
print('\n', df[[c for c in show if c in df.columns]].to_string(index=False))
for gname in ['AR', 'NR5A1']:
    x = df[df['Gene'] == gname]
    if len(x):
        print(f'\n[{gname}] RNA specificity:', x['RNA_tissue_specificity'].iloc[0])
        print(f'[{gname}] RNA tissue nTPM:', str(x['RNA_tissue_specific_nTPM'].iloc[0])[:300])
print(f'\nFiles written to: {OUT}')
