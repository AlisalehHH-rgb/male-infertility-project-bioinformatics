# Extracted verbatim from notebooks/Final_Organized_A_full_rerun.ipynb (cell 15): S02B check - matched infertility terms
# Requires the setup step (00) to have set PROJECT_BASE and RAW_DIR environment variables.
import os
import pandas as pd
OUT = os.environ['PROJECT_BASE'] + '/final/S02B_ClinVar_phenotype'
d = pd.read_csv(f'{OUT}/clinvar_phenotype_stratified_v2.csv')
terms = d['Matched_infertility_terms'].fillna('').str.split(r' \| ').explode()
terms = terms[terms != '']
print('ALL matched infertility terms:'); print(terms.value_counts().to_string())
print('\nPossible female terms:', terms[terms.str.contains('female|ovar|oocyte|embryo|uter|endometr', case=False)].unique().tolist())
print('\nXRCC2 conditions:'); print(d[d.Gene == 'XRCC2']['Other_conditions'].str.split(r' \| ').explode().value_counts().to_string())
for g in ['DMRT1', 'STAG3', 'MSH4', 'MSH5', 'MEIOB', 'MEI1']:
    s = d[(d.Gene == g) & (d.Phenotype_category == 'Other-phenotype-only')]['Other_conditions']
    print(f'\n{g} OTHER-only:', s.str.split(r' \| ').explode().value_counts().head(4).to_dict())
