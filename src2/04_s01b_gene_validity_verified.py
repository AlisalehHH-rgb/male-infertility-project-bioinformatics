# Extracted verbatim from notebooks/Final_Organized_A_full_rerun.ipynb (cell 9): S01B - gene validity: verified table (the single gene-list source)
# Requires the setup step (00) to have set PROJECT_BASE and RAW_DIR environment variables.
import os
if not os.path.ismount('/content/drive'):
    from google.colab import drive
    drive.mount('/content/drive')
assert os.path.ismount('/content/drive'), 'Drive is NOT mounted: stopping so nothing is written to a temporary local folder'

import pandas as pd
BASE = os.environ['PROJECT_BASE']
OUT = f'{BASE}/final/S01B_gene_validity'
assert OUT.startswith(BASE); os.makedirs(OUT, exist_ok=True)

H = {  # Houston 2021 Table II: (phenotype, inheritance, score, class)
 'AR':('Non-obstructive azoospermia','XL',17,'Definitive'), 'DMRT1':('Non-obstructive azoospermia','AD',10,'Moderate'),
 'M1AP':('Non-obstructive azoospermia','AR',12,'Moderate'), 'MEI1':('Non-obstructive azoospermia','AR',13,'Strong'),
 'STAG3':('Non-obstructive azoospermia','AR',11.5,'Moderate'), 'SYCP2':('Severe oligozoospermia','AD',10.75,'Moderate'),
 'TEX11':('Non-obstructive azoospermia','XL',16,'Definitive'), 'TEX14':('Non-obstructive azoospermia','AR',10,'Moderate'),
 'TEX15':('Non-obstructive azoospermia','AR',13.5,'Strong'), 'XRCC2':('Non-obstructive azoospermia','AR',10,'Moderate'),
 'NR5A1':('Isolated spermatogenic failure','AD',14,'Strong')}
S = {  # Stallmeyer, Dicke, Tuttelmann. Andrology 2025;13:1011-1024, Table 1 (ClinGen-based): (class, inheritance)
 'AR':('Definitive','XL'), 'DMRT1':('Moderate','AD'), 'M1AP':('Definitive','AR'), 'MEI1':('Definitive','AR'),
 'MEIOB':('Definitive','AR'), 'MSH4':('Definitive','AR'), 'MSH5':('Strong','AR'), 'NR5A1':('Definitive','AD'),
 'STAG3':('Strong','AR'), 'SYCE1':('Definitive','AR'), 'TERB1':('Moderate','AR'), 'TEX11':('Definitive','XL'),
 'TEX14':('Strong','AR'), 'TEX15':('Strong','AR')}
genes = ['TEX11','STAG3','M1AP','TEX15','SYCP2','DMRT1','MSH4','MSH5','SYCE1','TERB1','TEX14','AR','NR5A1','MEI1','MEIOB','XRCC2','HORMAD1']
rank = {'Definitive': 3, 'Strong': 2, 'Moderate': 1}

rows = []
for g in genes:
    h, s = H.get(g), S.get(g)
    hc = h[3] if h else 'Not found'; sc = s[0] if s else 'Not found'
    known = [c for c in (hc, sc) if c in rank]
    best = max(known, key=rank.get) if known else 'No evidence'
    validated = bool(known)
    oligo_only = bool(h) and ('oligozoospermia' in h[0].lower()) and not s
    scope = 'Not applicable' if not validated else ('Oligozoospermia-level' if oligo_only else 'NOA-level')
    n_src = (1 if h else 0) + (1 if s else 0)
    rows.append({'Gene': g, 'Validated_for_NOA_SF': 'Yes' if validated else 'No', 'Validity_Scope': scope,
                 'Houston_class': hc, 'Zhao_class': 'Not used (reference unresolved)',
                 'Houston_phenotype': h[0] if h else '', 'Houston_inheritance': h[1] if h else '', 'Houston_score': h[2] if h else '',
                 'Second_source_class': sc, 'Second_source_inheritance': s[1] if s else '',
                 'Best_tier': best, 'Supporting_sources_n': n_src,
                 'Sources': 'Houston 2021 Hum Reprod Update 28:15-29 doi:10.1093/humupd/dmab030 Table II; Stallmeyer 2025 Andrology 13:1011-1024 doi:10.1111/andr.13728 Table 1; accessed 2026-10-03'})
d = pd.DataFrame(rows)
path = f'{OUT}/gene_validity_summary_v2_1.csv'
d.to_csv(path, index=False)
print('Saved:', path, '| exists on Drive:', os.path.exists(path))
print('NOA-level:', int((d.Validity_Scope == 'NOA-level').sum()), '| oligozoospermia-level:', int((d.Validity_Scope == 'Oligozoospermia-level').sum()),
      '| not validated:', int((d.Validated_for_NOA_SF == 'No').sum()))
