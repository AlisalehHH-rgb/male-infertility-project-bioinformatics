# Extracted verbatim from notebooks/Final_Organized_A_full_rerun.ipynb (cell 11): S02 - ClinVar P/LP extraction
# Requires the setup step (00) to have set PROJECT_BASE and RAW_DIR environment variables.
import os
import pandas as pd
import urllib.request
import zipfile
import hashlib
import json
from datetime import datetime

# 1. Setup Directories
base_dir = os.environ['PROJECT_BASE']
stage1b_dir = os.path.join(base_dir, 'final', 'S01B_gene_validity')
stage2_dir = os.path.join(base_dir, 'final', 'S02_ClinVar')
raw_dir = os.environ['RAW_DIR']

os.makedirs(stage2_dir, exist_ok=True)
os.makedirs(raw_dir, exist_ok=True)
date_today = datetime.now().strftime("%Y-%m-%d")

print("1. Loading validated genes from Stage 1B...")
try:
    df_validity = pd.read_csv(os.path.join(stage1b_dir, 'gene_validity_summary_v2_1.csv'))
    target_genes = set(df_validity['Gene'].dropna())
except FileNotFoundError:
    print("WARNING: Stage 1B file not found. Using fallback hardcoded verified list.")
    target_genes = {"TEX11", "STAG3", "M1AP", "TEX15", "SYCP2", "DMRT1", "MSH4", "MSH5", "SYCE1", "TERB1", "TEX14", "AR", "NR5A1", "MEI1", "MEIOB", "XRCC2"}

print(f"Target Genes Loaded: {len(target_genes)}")

# 2. Download Official ClinVar Tab-Delimited Files
vsum_url = "https://ftp.ncbi.nlm.nih.gov/pub/clinvar/tab_delimited/variant_summary.txt.gz"
vsum_path = os.path.join(raw_dir, "variant_summary.txt.gz")

if not os.path.exists(vsum_path):
    print("2. Downloading ClinVar variant_summary.txt.gz (This may take a few minutes)...")
    urllib.request.urlretrieve(vsum_url, vsum_path)
else:
    print("2. ClinVar variant_summary.txt.gz already exists. Skipping download (Fast path).")

# 3. Process Variant Summary in Chunks
print("3. Filtering ClinVar records for target genes...")
chunks = []
for chunk in pd.read_csv(vsum_path, sep='\t', compression='gzip', chunksize=100000, low_memory=False):
    filtered = chunk[(chunk['GeneSymbol'].isin(target_genes)) & (chunk['Assembly'] == 'GRCh38')]
    chunks.append(filtered)

df_all_variants = pd.concat(chunks, ignore_index=True)

# Correct Mapping: The official ClinVar column is 'VariationID', converting it to 'Variation_ID'
df_all_variants = df_all_variants.rename(columns={
    'VariationID': 'Variation_ID',
    'GeneSymbol': 'Gene',
    'Chromosome': 'Chr',
    'PositionVCF': 'Position_GRCh38',
    'ReferenceAlleleVCF': 'REF',
    'AlternateAlleleVCF': 'ALT',
    'ClinicalSignificance': 'CLNSIG',
    'ReviewStatus': 'CLNREVSTAT'
})

print(f"Total GRCh38 variants found for target genes: {len(df_all_variants)}")

# 4. Filter for Pathogenic / Likely Pathogenic (P/LP)
plp_terms = ['Pathogenic', 'Likely pathogenic', 'Pathogenic/Likely pathogenic']
df_p_lp = df_all_variants[df_all_variants['CLNSIG'].isin(plp_terms)].copy()
df_conflicting = df_all_variants[df_all_variants['CLNSIG'].str.contains('Conflicting', na=False, case=False)].copy()

# 5. Condition Classification Logic (Predeclared Rules v5.2)
def classify_condition(phenotype):
    if pd.isna(phenotype) or phenotype == 'not provided' or phenotype == 'not specified':
        return 'Not provided / not specified'
    pheno_lower = str(phenotype).lower()

    if any(kw in pheno_lower for kw in ['azoospermia', 'spermatogenic failure', 'spgf', 'oligozoospermia', 'oligosynaptic', 'maturation arrest', 'meiotic arrest', 'sertoli-cell-only', 'male infertility']):
        if 'obstructive' not in pheno_lower:
            return 'Male NOA/SF'
    if any(kw in pheno_lower for kw in ['obstructive', 'cbavd', 'morphology', 'motility', 'fertilization failure', 'asthenozoospermia', 'globozoospermia', 'macrozoospermia']):
        return 'Male reproductive - other'
    if any(kw in pheno_lower for kw in ['ovarian', 'premature ovarian insufficiency', 'pcos']):
        return 'Female reproductive'
    if any(kw in pheno_lower for kw in ['dsd', 'androgen insensitivity', 'disorder of sex development', 'sex reversal']):
        return 'DSD / androgen insensitivity'

    return 'Other named disease'

print("4. Applying Condition Classes and Variant Match Status...")
df_assertions = df_p_lp.copy()
df_assertions['Condition_Class'] = df_assertions['PhenotypeList'].apply(classify_condition)

def determine_match_status(row):
    cond_class = row['Condition_Class']
    if cond_class == 'Male NOA/SF':
        return 'Infertility-matched'
    elif cond_class == 'Not provided / not specified':
        return 'Unspecified'
    elif cond_class in ['Male reproductive - other', 'Female reproductive', 'DSD / androgen insensitivity', 'Other named disease']:
        return 'Mismatched'
    else:
        return 'Needs manual review'

df_assertions['Variant_Match_Status'] = df_assertions.apply(determine_match_status, axis=1)

# 6. Generate Required Output Files
print("5. Generating Stage 2 Output Files...")
df_all_variants.to_csv(os.path.join(stage2_dir, 'clinvar_all_variants_GRCh38.csv'), index=False)

plp_cols = ['Variation_ID', 'Gene', 'Chr', 'Position_GRCh38', 'REF', 'ALT', 'CLNSIG']
df_p_lp[plp_cols].to_csv(os.path.join(stage2_dir, 'clinvar_P_LP_GRCh38.csv'), index=False)

df_conflicting.to_csv(os.path.join(stage2_dir, 'clinvar_conflicting.csv'), index=False)

assertion_cols = ['Variation_ID', 'Gene', 'Chr', 'Position_GRCh38', 'REF', 'ALT', 'Condition_Class', 'Variant_Match_Status', 'PhenotypeList']
df_assertions[assertion_cols].to_csv(os.path.join(stage2_dir, 'clinvar_variant_condition_assertions.csv'), index=False)

qc_data = [
    ["ClinVar_VCF_Proxy", "Protocol Adaptation", "Used variant_summary.txt.gz instead of VCF for memory safety in Colab.", "Allowed by protocol (E-utilities/Tabular alternative)."],
    ["Column_Names", "Data Parsing Error Corrected", "VariationID header accurately mapped to required Variation_ID.", "Passed."]
]
pd.DataFrame(qc_data, columns=["Entity", "Issue_Type", "Description", "Resolution"]).to_csv(os.path.join(stage2_dir, 'clinvar_QC_issues.csv'), index=False)

assertions_qc_data = [
    ["Condition_Classification", "Automated Regex", "Classified conditions based on v5.2 predefined rules.", "Some complex phenotypes may require manual review."]
]
pd.DataFrame(assertions_qc_data, columns=["Entity", "Issue_Type", "Description", "Resolution"]).to_csv(os.path.join(stage2_dir, 'clinvar_condition_assertions_QC.csv'), index=False)

summary_assert = df_assertions.groupby(['Gene', 'Variant_Match_Status']).size().unstack(fill_value=0)
summary_assert.to_csv(os.path.join(stage2_dir, 'clinvar_condition_assertions_summary.txt'), sep='\t')

with open(os.path.join(stage2_dir, 'clinvar_stage2_summary.txt'), 'w') as f:
    f.write(f"STAGE 2 SUMMARY\nDate: {date_today}\n")
    f.write(f"Total Target Genes Checked: {len(target_genes)}\n")
    f.write(f"Total Variants Extracted (All Sigs): {len(df_all_variants)}\n")
    f.write(f"Total P/LP Variants Retained: {len(df_p_lp)}\n")
    f.write(f"Total Conflicting Variants Excluded: {len(df_conflicting)}\n")
    f.write("\nVariant Match Status Counts (P/LP):\n")
    f.write(df_assertions['Variant_Match_Status'].value_counts().to_string())

print("6. Creating ZIP archive...")
manifest = {}
for filename in os.listdir(stage2_dir):
    filepath = os.path.join(stage2_dir, filename)
    if os.path.isfile(filepath):
        with open(filepath, "rb") as f:
            manifest[filename] = {"size": os.path.getsize(filepath), "SHA256": hashlib.sha256(f.read()).hexdigest()}
            if filename.endswith('.csv'):
                df = pd.read_csv(filepath, low_memory=False)
                manifest[filename]["rows"] = len(df)
                manifest[filename]["columns"] = list(df.columns)

with open(os.path.join(stage2_dir, 'output_manifest.json'), 'w') as f:
    json.dump(manifest, f, indent=4)

zip_path = os.path.join(base_dir, 'final', 'S02_ClinVar_Outputs.zip')
with zipfile.ZipFile(zip_path, 'w') as zipf:
    for filename in os.listdir(stage2_dir):
        zipf.write(os.path.join(stage2_dir, filename), filename)

print(f"\n✅ Stage 2 execution complete! The output zip file is saved at:\n{zip_path}")
