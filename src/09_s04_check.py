# Extracted verbatim from notebooks/Final_Organized_A_full_rerun.ipynb (cell 19): S04 check
# Requires the setup step (00) to have set PROJECT_BASE and RAW_DIR environment variables.
import os
import pandas as pd, numpy as np
BASE = os.environ['PROJECT_BASE']
OUT = f'{BASE}/final/S04_VEP_gnomAD'
pd.set_option('display.width', 250)
r = pd.read_csv(f'{OUT}/vep_annotation_v2.csv')
a = r[r.Annotation_status == 'annotated'].copy()
a['Type'] = np.where((a.REF.str.len() == 1) & (a.ALT.str.len() == 1), 'SNV', 'indel')
print('1) CADD missing by type'); print(pd.crosstab(a.Type, a.CADD_PHRED.isna()))
print('\n2) gnomAD status by type'); print(pd.crosstab(a.Type, a.gnomAD_status))
print('\n3) LoF by consequence'); print(pd.crosstab(a.VEP_most_severe_consequence, a.LoF.fillna('NA')))
rare_types = ['synonymous_variant', 'intron_variant', 'splice_region_variant', 'splice_donor_5th_base_variant', 'start_lost']
odd = a[a.VEP_most_severe_consequence.isin(rare_types)]
print('\n4) Unusual consequence types'); print(odd[['Gene', 'Variation_ID', 'HGVSc', 'VEP_most_severe_consequence', 'SpliceAI_max_DS', 'gnomAD_status']].to_string(index=False))
f = a[a.gnomAD_status == 'found']
hi = f[f.gnomAD_max_AF > 0.001]
print('\n5) Found in gnomAD with AF > 0.001:', len(hi), 'of', len(f))
print(hi[['Gene', 'Variation_ID', 'HGVSc', 'gnomAD_max_AF']].sort_values('gnomAD_max_AF', ascending=False).to_string(index=False))
