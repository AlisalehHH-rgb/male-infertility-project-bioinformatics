# Extracted verbatim from notebooks/Final_Organized_A_full_rerun.ipynb (cell 13): S02B - ClinVar phenotype stratification
# Requires the setup step (00) to have set PROJECT_BASE and RAW_DIR environment variables.
import os, re, glob, json, hashlib
import pandas as pd

BASE = os.environ['PROJECT_BASE']
IN_CLINVAR = f'{BASE}/final/S02_ClinVar/clinvar_P_LP_GRCh38.csv'    # READ ONLY
OUT = f'{BASE}/final/S02B_ClinVar_phenotype'
assert OUT.startswith(BASE)
os.makedirs(OUT, exist_ok=True)

df = pd.read_csv(IN_CLINVAR)
ids = set(df['Variation_ID'].astype(int))

# 1. locate (or download) ClinVar variant_summary
found = sorted(glob.glob(os.environ['RAW_DIR'] + '/variant_summary*.txt*'))
if found:
    src = found[0]; origin = 'found in Drive'
else:
    import requests
    src = os.environ['RAW_DIR'] + '/variant_summary_v2.txt.gz'; os.makedirs(os.path.dirname(src), exist_ok=True)
    url = 'https://ftp.ncbi.nlm.nih.gov/pub/clinvar/tab_delimited/variant_summary.txt.gz'
    with requests.get(url, stream=True, timeout=300) as r:
        r.raise_for_status()
        with open(src, 'wb') as f:
            for chunk in r.iter_content(1 << 20): f.write(chunk)
    origin = url
print('variant_summary source:', src, '|', origin)

head = pd.read_csv(src, sep='\t', nrows=0).columns.tolist()
need = ['VariationID', 'GeneSymbol', 'ClinicalSignificance', 'ReviewStatus', 'PhenotypeList', 'Assembly', 'LastEvaluated', 'NumberSubmitters']
miss = [c for c in need if c not in head]
if miss: raise RuntimeError(f'Columns missing in variant_summary: {miss}. Found: {head}')

parts = []
for ch in pd.read_csv(src, sep='\t', usecols=need, chunksize=200000, low_memory=False):
    parts.append(ch[(ch['VariationID'].isin(ids)) & (ch['Assembly'] == 'GRCh38')])
vs = pd.concat(parts).drop_duplicates('VariationID')
print('ClinVar rows matched:', len(vs), 'of', len(ids))

# 2. classification by explicit keyword rules (printed below for review)
INFERT = r'infertil|azoosperm|oligosperm|oligozoosperm|asthenozoosperm|teratozoosperm|spermatogenic failure|sperm|non-?obstructive'
UNINFO = r'^(not provided|not specified|see cases|inborn genetic diseases|)$'
def split_conditions(s):
    return [c.strip() for c in re.split(r'[|;]', str(s)) if c.strip() and str(s) != 'nan']
def classify(s):
    conds = split_conditions(s)
    inf = [c for c in conds if re.search(INFERT, c, re.I)]
    unin = [c for c in conds if re.fullmatch(UNINFO, c, re.I)]
    oth = [c for c in conds if c not in inf and c not in unin]
    if inf and oth: cat = 'Mixed (infertility + other phenotype)'
    elif inf: cat = 'NOA/male-infertility-specific'
    elif oth: cat = 'Other-phenotype-only'
    else: cat = 'No informative phenotype'
    return cat, ' | '.join(sorted(set(inf))), ' | '.join(sorted(set(oth)))
res = vs['PhenotypeList'].apply(classify)
vs['Phenotype_category'] = [x[0] for x in res]
vs['Matched_infertility_terms'] = [x[1] for x in res]
vs['Other_conditions'] = [x[2] for x in res]
stars = {'practice guideline': 4, 'reviewed by expert panel': 3, 'criteria provided, multiple submitters, no conflicts': 2,
         'criteria provided, single submitter': 1, 'criteria provided, conflicting classifications': 1,
         'criteria provided, conflicting interpretations': 1}
vs['Review_stars'] = vs['ReviewStatus'].str.lower().map(stars).fillna(0).astype(int)

out = df.merge(vs.rename(columns={'VariationID': 'Variation_ID'}).drop(columns=['GeneSymbol', 'Assembly']), on='Variation_ID', how='left')
out['Phenotype_category'] = out['Phenotype_category'].fillna('NOT FOUND in variant_summary')
out.to_csv(f'{OUT}/clinvar_phenotype_stratified_v2.csv', index=False)
json.dump({'variant_summary': src, 'origin': origin, 'rules_INFERT': INFERT, 'rules_UNINFO': UNINFO,
           'note': 'Keyword classification of ClinVar PhenotypeList; review printed condition lists'},
          open(f'{OUT}/stratification_provenance_v2.json', 'w'), indent=2)

# 3. report
pd.set_option('display.width', 250)
print('\n=== REPORT ===')
print(out['Phenotype_category'].value_counts().to_string())
tab = pd.crosstab(out['Gene'], out['Phenotype_category'], margins=True)
print('\n', tab.to_string())
spec = out[out['Phenotype_category'].isin(['NOA/male-infertility-specific', 'Mixed (infertility + other phenotype)'])]
print(f'\nP/LP total: {len(out)} | with infertility evidence (specific+mixed): {len(spec)}')
print('Review stars (all):', out['Review_stars'].value_counts().sort_index().to_dict())
print('\nInfertility terms matched:', out['Matched_infertility_terms'].replace('', pd.NA).dropna().str.split(' \| ').explode().value_counts().head(15).to_dict())
oth = out.loc[out['Phenotype_category'] == 'Other-phenotype-only', 'Other_conditions'].str.split(' \| ').explode().value_counts()
print('\nTop conditions classed as OTHER (review them):'); print(oth.head(25).to_string())
print('\nSaved to:', OUT)
