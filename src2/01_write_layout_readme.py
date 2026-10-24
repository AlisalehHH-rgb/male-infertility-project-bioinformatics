# Extracted verbatim from notebooks/Final_Organized_A_full_rerun.ipynb (cell 3): README of this run
# Requires the setup step (00) to have set PROJECT_BASE and RAW_DIR environment variables.
# Writes final/README.md describing the organized layout
import os, datetime
BASE = os.environ['PROJECT_BASE']
os.makedirs(f'{BASE}/final', exist_ok=True)
MAPPING = """| Old folder (Final - Google Colab/final/) | New folder | Content |
|---|---|---|
| Stage_1 | S01_MFGA | Stage 1 (initial run) |
| Stage_1B | S01B_gene_validity/initial_list | initial hand-entered validity list (kept for the record) |
| Stage_1B_v2 | S01B_gene_validity | verified validity table (gene_validity_summary_v2_1.csv) - the ONE gene-list source |
| Stage_2 | S02_ClinVar | ClinVar P/LP extraction |
| Stage_2_v2 | S02B_ClinVar_phenotype | phenotype stratification of ClinVar conditions |
| Stage_4_v2 | S04_VEP_gnomAD | Ensembl VEP + gnomAD v4 |
| Stage_5_v2_2 | S05_prioritization | prioritization (v2.2, MANE-consequence fix) |
| Stage_6_v2 | S06_GTEx | GTEx v8 expression |
| Stage_7_v2 | S07_HPA | Human Protein Atlas (v2.1 patch included) |
| Stage_1/1B/2_Outputs.zip | S01_MFGA_ / S01B_initial_list_ / S02_ClinVar_Outputs.zip | stage archives |"""
open(f'{BASE}/final/README.md', 'w', encoding='utf-8').write(f"""# Organized layout (full run)
Created: {datetime.datetime.now().isoformat(timespec='seconds')}
Notebook: Final_Organized_A_full_rerun.ipynb. The analysis code is unchanged; only folder names and cell order were organized.
Gene-list source for S02, S06 and S05: S01B_gene_validity/gene_validity_summary_v2_1.csv
(the same 17 genes, in the same order, as the list kept in S01B_gene_validity/initial_list/).
Raw files used: {os.environ['RAW_DIR']}
The folders Stage_* in this same final/ folder belong to the earlier layout and are left untouched.

{MAPPING}
""")
print('README written:', f'{BASE}/final/README.md')
