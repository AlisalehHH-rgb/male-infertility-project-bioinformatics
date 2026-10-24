# Extracted verbatim from notebooks/Final_Organized_A_full_rerun.ipynb (cell 21): S06 - GTEx v8
# Requires the setup step (00) to have set PROJECT_BASE and RAW_DIR environment variables.
# =============================================================================
# STAGE 6 (v2) - GTEx v8 median TPM, real data only.
# RULES: no fallback values, no "proxy" rows. If any step fails, the cell STOPS.
# Paste this whole file into ONE Colab cell and run it.
# =============================================================================
import os, json, hashlib, time, requests
import numpy as np
import pandas as pd
from datetime import datetime

from google.colab import drive
if not os.path.exists('/content/drive/MyDrive'):
    drive.mount('/content/drive')

BASE = os.environ['PROJECT_BASE']
RAW = os.environ['RAW_DIR']
OUT = f'{BASE}/final/S06_GTEx'
os.makedirs(RAW, exist_ok=True)
os.makedirs(OUT, exist_ok=True)
TODAY = datetime.now().strftime('%Y-%m-%d')

FNAME = 'GTEx_Analysis_2017-06-05_v8_RNASeQCv1.1.9_gene_median_tpm.gct.gz'
URLS = [
    f'https://storage.googleapis.com/adult-gtex/bulk-gex/v8/rna-seq/{FNAME}',
    f'https://storage.googleapis.com/gtex_analysis_v8/rna_seq_data/{FNAME}',
]
LOCAL = os.path.join(RAW, FNAME)

# The earlier run used ".../gene_median_tpm.gct.gz" (file name without the
# GTEx_Analysis_2017-06-05_v8_RNASeQCv1.1.9_ prefix) -> HTTP 404.

# -----------------------------------------------------------------------------
# 1. Genes: read the validity table (all genes, not only the 12 prioritized)
# -----------------------------------------------------------------------------
val_path = f'{BASE}/final/S01B_gene_validity/gene_validity_summary_v2_1.csv'
if os.path.exists(val_path):
    GENES = pd.read_csv(val_path)['Gene'].dropna().unique().tolist()
    genes_source = val_path
else:
    GENES = ['TEX11','STAG3','M1AP','TEX15','SYCP2','DMRT1','MSH4','MSH5','SYCE1',
             'TERB1','TEX14','AR','NR5A1','MEI1','MEIOB','XRCC2','HORMAD1']
    genes_source = 'hard-coded list of gene SYMBOLS (validity file not found)'
print(f'Genes: {len(GENES)} | source: {genes_source}')

# -----------------------------------------------------------------------------
# 2. Download (or reuse) the real file, verify it, STOP if impossible
# -----------------------------------------------------------------------------
def is_gzip(path):
    with open(path, 'rb') as f:
        return f.read(2) == b'\x1f\x8b'

attempts, used_url = [], None
if os.path.exists(LOCAL) and is_gzip(LOCAL) and os.path.getsize(LOCAL) > 1_000_000:
    used_url = 'local file already present (manual upload or earlier download)'
else:
    for url in URLS:
        try:
            r = requests.get(url, timeout=120)
            attempts.append((url, r.status_code))
            if r.status_code == 200 and r.content[:2] == b'\x1f\x8b':
                with open(LOCAL, 'wb') as f:
                    f.write(r.content)
                used_url = url
                break
        except Exception as e:
            attempts.append((url, f'ERROR {e}'))

print('Download attempts:')
for a in attempts:
    print('  ', a)

if used_url is None:
    raise RuntimeError(
        'GTEx file could NOT be obtained. No fallback values will be generated.\n'
        'Manual fix: download the file named\n  ' + FNAME + '\n'
        'from https://gtexportal.org/home/downloads/adult-gtex/bulk_tissue_expression '
        '(Median gene-level TPM by tissue), upload it to\n  ' + RAW + '\nand re-run this cell.')

sha256 = hashlib.sha256(open(LOCAL, 'rb').read()).hexdigest()
size_bytes = os.path.getsize(LOCAL)
print(f'Using: {used_url}\nSize: {size_bytes:,} bytes | SHA256: {sha256}')

# -----------------------------------------------------------------------------
# 3. Parse and validate the file structure
# -----------------------------------------------------------------------------
gct = pd.read_csv(LOCAL, sep='\t', skiprows=2, compression='gzip')
tissue_cols = [c for c in gct.columns if c not in ('Name', 'Description')]
gct['base_id'] = gct['Name'].astype(str).str.split('.').str[0]

checks = {}
checks['rows_>=50000'] = len(gct) >= 50000
checks['n_tissues_>=50'] = len(tissue_cols) >= 50
checks['Testis_column_present'] = 'Testis' in tissue_cols
checks['all_IDs_start_ENSG'] = bool(gct['Name'].astype(str).str.startswith('ENSG').all())
print(f'Rows: {len(gct):,} | tissues: {len(tissue_cols)}')
if not all(checks[k] for k in ['rows_>=50000', 'n_tissues_>=50', 'Testis_column_present']):
    raise RuntimeError(f'Unexpected file structure, stopping: {checks}')

# -----------------------------------------------------------------------------
# 4. Map genes by Ensembl ID (primary) - symbols alone can be outdated:
#    GTEx v8 uses GENCODE v26 names (e.g. TERB1 may appear under an old name).
# -----------------------------------------------------------------------------
def ensembl_id(symbol):
    url = f'https://rest.ensembl.org/lookup/symbol/homo_sapiens/{symbol}?content-type=application/json'
    for _ in range(3):
        try:
            r = requests.get(url, timeout=30)
            if r.status_code == 200:
                return r.json().get('id')
            if r.status_code == 400:
                return None
        except Exception:
            pass
        time.sleep(2)
    return None

def tau_index(tpm):
    x = np.log2(tpm.astype(float) + 1)
    if x.max() <= 0:
        return np.nan
    return float((1 - x / x.max()).sum() / (len(x) - 1))

summary, long_rows = [], []
for g in GENES:
    ens = ensembl_id(g)
    hit, method = pd.DataFrame(), 'Not found'
    if ens:
        hit = gct[gct['base_id'] == ens]
        method = 'Ensembl_ID'
    if hit.empty:
        hit = gct[gct['Description'] == g]
        method = 'Symbol_only (not ID-verified)' if not hit.empty else 'Not found'

    if len(hit) != 1:
        summary.append({'Gene': g, 'Ensembl_Gene_ID': ens or 'Not available',
                        'Mapping_Method': method, 'Status': 'NOT_FOUND' if hit.empty else 'AMBIGUOUS'})
        continue

    row = hit.iloc[0]
    tpm = row[tissue_cols].astype(float)
    others = tpm.drop('Testis')
    ranked = tpm.sort_values(ascending=False)
    mean_other = others.mean()
    id_check = ('match' if (ens and row['base_id'] == ens)
                else 'not checked (Ensembl lookup failed)' if not ens else 'MISMATCH')

    summary.append({
        'Gene': g,
        'Ensembl_Gene_ID': row['Name'],
        'GTEx_Description': row['Description'],
        'Mapping_Method': method,
        'ID_Check_vs_Ensembl': id_check,
        'Testis_Median_TPM': tpm['Testis'],
        'Testis_Rank_of_%d' % len(tpm): int(list(ranked.index).index('Testis') + 1),
        'Top_Tissue': ranked.index[0], 'Top_TPM': ranked.iloc[0],
        'Second_Tissue': ranked.index[1], 'Second_TPM': ranked.iloc[1],
        'Mean_TPM_Other_Tissues': mean_other,
        'Testis_over_Mean_Others': tpm['Testis'] / mean_other if mean_other > 0 else np.nan,
        'Testis_over_Max_Other': tpm['Testis'] / others.max() if others.max() > 0 else np.nan,
        'Tau_log2TPM1': tau_index(tpm),
        'Prostate_TPM': tpm.get('Prostate', np.nan),
        'Source': f'GTEx v8 {FNAME}',
        'Status': 'OK',
    })
    for t in tissue_cols:
        long_rows.append([g, row['Name'], t, float(tpm[t])])

df_sum = pd.DataFrame(summary)
df_long = pd.DataFrame(long_rows, columns=['Gene', 'Ensembl_Gene_ID', 'Tissue', 'Median_TPM'])

# -----------------------------------------------------------------------------
# 5. Biological sanity check (reported, never silently "fixed")
# -----------------------------------------------------------------------------
sanity = {}
ar = df_long[df_long['Gene'] == 'AR'].sort_values('Median_TPM', ascending=False)
if not ar.empty:
    ar_rank_prostate = list(ar['Tissue']).index('Prostate') + 1
    sanity['AR_top5_tissues'] = ar.head(5)[['Tissue', 'Median_TPM']].values.tolist()
    sanity['AR_prostate_rank'] = ar_rank_prostate
    sanity['AR_prostate_in_top10'] = ar_rank_prostate <= 10

# -----------------------------------------------------------------------------
# 6. Save outputs + provenance
# -----------------------------------------------------------------------------
df_sum.to_csv(f'{OUT}/gtex_tissue_expression_v2.csv', index=False)
df_long.to_csv(f'{OUT}/gtex_all_tissues_long_v2.csv', index=False)
prov = {
    'source_url_used': used_url, 'attempts': [list(map(str, a)) for a in attempts],
    'file_name': FNAME, 'version': 'GTEx v8 (GENCODE v26, RNASeQCv1.1.9)',
    'access_date': TODAY, 'size_bytes': size_bytes, 'sha256': sha256,
    'n_rows_in_file': int(len(gct)), 'n_tissues': len(tissue_cols),
    'genes_source': genes_source,
    'formulas': {
        'Testis_over_Mean_Others': 'Testis TPM / mean(TPM of the other tissues)',
        'Testis_over_Max_Other': 'Testis TPM / max(TPM of the other tissues)',
        'Tau': 'sum(1 - x_i / max(x)) / (N - 1), x = log2(TPM + 1), N = number of tissues'},
    'structure_checks': checks, 'sanity_checks': sanity,
}
with open(f'{OUT}/gtex_provenance_v2.json', 'w') as f:
    json.dump(prov, f, indent=2, default=str)

# -----------------------------------------------------------------------------
# 7. Plain report (what worked, what did not)
# -----------------------------------------------------------------------------
print('\n================ REPORT ================')
print('Structure checks:', checks)
print('Genes requested:', len(GENES), '| mapped OK:', int((df_sum['Status'] == 'OK').sum()))
bad = df_sum[df_sum['Status'] != 'OK']
if len(bad):
    print('NOT MAPPED:', bad[['Gene', 'Status']].values.tolist())
if 'ID_Check_vs_Ensembl' in df_sum:
    print('ID check counts:', df_sum['ID_Check_vs_Ensembl'].value_counts(dropna=False).to_dict())
    sym_only = df_sum[df_sum['Mapping_Method'].astype(str).str.startswith('Symbol_only')]
    if len(sym_only):
        print('Mapped by symbol only (verify manually):', sym_only['Gene'].tolist())
print('Sanity:', sanity)
if sanity and not sanity.get('AR_prostate_in_top10', True):
    print('WARNING: AR is not high in prostate. Investigate mapping/columns before using this table.')
show = ['Gene', 'Testis_Median_TPM', 'Top_Tissue', 'Second_Tissue', 'Testis_over_Mean_Others', 'Tau_log2TPM1']
print(df_sum[[c for c in show if c in df_sum.columns]].round(2).to_string(index=False))
print(f'\nFiles written to: {OUT}')

