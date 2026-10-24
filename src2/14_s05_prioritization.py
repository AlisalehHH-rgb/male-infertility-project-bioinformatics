# Extracted verbatim from notebooks/Final_Organized_A_full_rerun.ipynb (cell 29): S05 - prioritization (v2.2)
# Requires the setup step (00) to have set PROJECT_BASE and RAW_DIR environment variables.
# Cell: Stage 5 v2.2 (corrected: severity from the MANE Select transcript consequence)
# Uses the same Drive mount as the other cells (/content/drive); mounts it if needed.
import os
if not os.path.ismount('/content/drive'):
    from google.colab import drive
    drive.mount('/content/drive')
assert os.path.ismount('/content/drive'), 'Drive is NOT mounted: stopping so nothing is written to a temporary local folder'
import os, json
import numpy as np
import pandas as pd

BASE = os.environ['PROJECT_BASE']
OUT = f'{BASE}/final/S05_prioritization'
assert OUT.startswith(BASE)
os.makedirs(OUT, exist_ok=True)

RARE_AF = 0.001
SPLICEAI_MIN = 0.5
CADD_MIN = 25
TOP_N = 3

# ---------- inputs (all read-only) ----------
vep = pd.read_csv(f'{BASE}/final/S04_VEP_gnomAD/vep_annotation_v2.csv')
strat = pd.read_csv(f'{BASE}/final/S02B_ClinVar_phenotype/clinvar_phenotype_stratified_v2.csv')
cols = ['Variation_ID', 'Phenotype_category', 'Matched_infertility_terms', 'Other_conditions', 'Review_stars', 'ReviewStatus']
d = vep.merge(strat[cols], on='Variation_ID', how='left')
val = pd.read_csv(f'{BASE}/final/S01B_gene_validity/gene_validity_summary_v2_1.csv')
val['Evidence_tier'] = val['Best_tier']

def group(r):
    if r['Validated_for_NOA_SF'] != 'Yes': return 'Exploratory (not validated)'
    if r['Validity_Scope'] == 'NOA-level': return 'Validated NOA-level'
    return 'Validated, oligozoospermia-level only'
val['Gene_group'] = val.apply(group, axis=1)
d = d.merge(val[['Gene', 'Evidence_tier', 'Gene_group', 'Supporting_sources_n']], on='Gene', how='left')
print(val[['Gene', 'Evidence_tier', 'Gene_group', 'Supporting_sources_n']].to_string(index=False))

# ---------- filter 1: phenotype ----------
def pheno(r):
    cat = str(r['Phenotype_category'])
    terms = str(r['Matched_infertility_terms'])
    if cat == 'NOA/male-infertility-specific':
        only_unspec = terms.strip() in ('Oligosynaptic infertility',)
        only_female = terms.strip() == 'Female infertility'
        if only_female: return 'EXCLUDE', 'female-only infertility term'
        if only_unspec: return 'PASS_LOWER', 'infertility term of unspecified sex only (Oligosynaptic infertility)'
        return 'PASS', 'male-infertility / spermatogenic-failure term'
    if cat.startswith('Mixed'):
        if terms.strip() == 'Female infertility': return 'EXCLUDE', 'female-only infertility term'
        return 'PASS_LOWER', 'mixed: infertility term plus other phenotype'
    if cat == 'No informative phenotype':
        return 'UNDETERMINED', 'ClinVar gives no informative phenotype'
    return 'EXCLUDE', 'other phenotype only: ' + str(r['Other_conditions'])[:80]
p = d.apply(pheno, axis=1)
d['F1_phenotype'] = [x[0] for x in p]
d['F1_reason'] = [x[1] for x in p]


# ---------- FIX (v2.2): severity must use the CHOSEN (MANE Select) transcript ----------
# VEP_most_severe_consequence is the worst consequence over ALL transcripts, so a variant
# that is only intronic on the MANE transcript could be scored as LoF (e.g. TEX11 c.37+10228del).
# Consequence_terms holds the terms of the chosen transcript, so the worst term is taken from there.
CONSEQ_ORDER = ['transcript_ablation', 'splice_acceptor_variant', 'splice_donor_variant', 'stop_gained',
                'frameshift_variant', 'stop_lost', 'start_lost', 'missense_variant', 'protein_altering_variant',
                'inframe_insertion', 'inframe_deletion', 'splice_donor_5th_base_variant', 'splice_region_variant',
                'splice_donor_region_variant', 'splice_polypyrimidine_tract_variant', 'synonymous_variant',
                'coding_sequence_variant', '5_prime_UTR_variant', 'intron_variant']
def worst_consequence(terms):
    ts = [t.strip() for t in str(terms).split(',') if t.strip()]
    for o in CONSEQ_ORDER:
        if o in ts: return o
    return ts[0] if ts else 'unknown'

# ---------- filter 2: severity ----------
LOF_TYPES = ['frameshift_variant', 'stop_gained', 'splice_donor_variant', 'splice_acceptor_variant']
def severity(r):
    cons = worst_consequence(r['Consequence_terms'])   # v2.2: MANE-transcript consequence
    if str(r['Annotation_status']) != 'annotated': return 9, 'NOT ANNOTATED'
    if r['LoF'] == 'HC': return 1, 'LoF (LOFTEE high confidence)'
    if cons in LOF_TYPES: return 1, 'LoF-type consequence (LOFTEE label missing or LC)'
    if cons == 'start_lost': return 2, 'start_lost'
    splice_like = cons in ['splice_region_variant', 'splice_donor_5th_base_variant', 'splice_donor_region_variant', 'intron_variant', 'synonymous_variant']
    ds = r['SpliceAI_max_DS']
    if splice_like and pd.notna(ds) and ds >= SPLICEAI_MIN: return 2, f'splice impact (SpliceAI {ds:.2f})'
    if cons == 'missense_variant':
        am_ok = str(r['AM_class']) == 'likely_pathogenic'
        cadd_ok = pd.notna(r['CADD_PHRED']) and r['CADD_PHRED'] >= CADD_MIN
        if am_ok or cadd_ok: return 3, 'missense with predictor support'
        if pd.isna(r['CADD_PHRED']) and pd.isna(r['AM_pathogenicity']): return 4, 'missense, no predictor available'
        return 4, 'missense, weak predictor support'
    return 4, 'uncertain consequence: ' + cons
s = d.apply(severity, axis=1)
d['Severity_tier'] = [x[0] for x in s]
d['F2_reason'] = [x[1] for x in s]
d['F2_severity'] = np.where(d['Severity_tier'] <= 3, 'PASS', np.where(d['Severity_tier'] == 4, 'UNDETERMINED', 'FAIL'))

# ---------- filter 3: population frequency ----------
def freq(r):
    st = str(r['gnomAD_status'])
    if st == 'not_in_gnomad_v4': return 'PASS', 'absent from gnomAD v4'
    if st == 'found':
        af = r['gnomAD_max_AF']
        if pd.notna(af) and af > RARE_AF: return 'REVIEW', f'gnomAD max AF {af:.4f} > {RARE_AF}'
        return 'PASS', f'gnomAD max AF {af:.6f}'
    return 'UNDETERMINED', 'gnomAD not queried or failed'
f3 = d.apply(freq, axis=1)
d['F3_frequency'] = [x[0] for x in f3]
d['F3_reason'] = [x[1] for x in f3]

# ---------- filter 4: gene validity ----------
d['F4_gene'] = np.where(d['Gene_group'] == 'Validated NOA-level', 'PASS',
                np.where(d['Gene_group'].str.startswith('Validated, oligo'), 'LOWER', 'EXPLORATORY'))

# ---------- final status ----------
def final(r):
    if r['F1_phenotype'] == 'EXCLUDE': return 'Excluded: phenotype'
    if r['F2_severity'] == 'FAIL': return 'Excluded: no annotation'
    if r['F3_frequency'] == 'REVIEW': return 'Review: frequency'
    if r['F4_gene'] == 'EXPLORATORY': return 'Exploratory gene (not validated)'
    if r['F2_severity'] == 'UNDETERMINED' or r['F1_phenotype'] == 'UNDETERMINED': return 'Candidate: undetermined evidence'
    if r['F1_phenotype'] == 'PASS_LOWER' or r['F4_gene'] == 'LOWER': return 'Candidate: lower confidence'
    return 'Candidate: strong'
d['Final_status'] = d.apply(final, axis=1)

rank = {'Candidate: strong': 0, 'Candidate: lower confidence': 1, 'Candidate: undetermined evidence': 2,
        'Review: frequency': 3, 'Exploratory gene (not validated)': 4, 'Excluded: phenotype': 8, 'Excluded: no annotation': 9}
d['Status_rank'] = d['Final_status'].map(rank)
d['Absent_gnomAD'] = (d['gnomAD_status'] == 'not_in_gnomad_v4').astype(int)
d = d.sort_values(['Gene', 'Status_rank', 'Severity_tier', 'Review_stars', 'Absent_gnomAD', 'CADD_PHRED'],
                  ascending=[True, True, True, False, False, False])
d.to_csv(f'{OUT}/variants_scored_all_v2_2.csv', index=False)

show = ['Gene', 'Variation_ID', 'HGVSc', 'HGVSp', 'Final_status', 'Severity_tier', 'F2_reason', 'F1_reason', 'F3_reason', 'Review_stars', 'CADD_PHRED']
top = d[d['Status_rank'] <= 2].groupby('Gene').head(TOP_N)
top[show].to_csv(f'{OUT}/prioritized_top_per_gene_v2_2.csv', index=False)

# ---------- gene summary ----------
g = d.groupby('Gene').agg(Total_PLP=('Variation_ID', 'count'))
g['Gene_group'] = val.set_index('Gene')['Gene_group']
g['Evidence_tier'] = val.set_index('Gene')['Evidence_tier']
for st in ['Candidate: strong', 'Candidate: lower confidence', 'Candidate: undetermined evidence', 'Review: frequency', 'Exploratory gene (not validated)', 'Excluded: phenotype', 'Excluded: no annotation']:
    g[st] = d[d['Final_status'] == st].groupby('Gene').size()
g = g.fillna(0)
for c in g.columns[2:]: g[c] = g[c].astype(int) if c != 'Evidence_tier' else g[c]
g['Supporting_sources_n'] = val.set_index('Gene')['Supporting_sources_n']
for path, keep in [(f'{BASE}/final/S06_GTEx/gtex_tissue_expression_v2.csv', ['Gene', 'Testis_over_Max_Other', 'Tau_log2TPM1']),
                   (f'{BASE}/final/S07_HPA/hpa_protein_expression_v2_1.csv', ['Gene', 'RNA_tissue_specificity', 'Testis_IHC_normal_max'])]:
    if os.path.exists(path):
        g = g.join(pd.read_csv(path)[keep].set_index('Gene'))
g.to_csv(f'{OUT}/gene_summary_v2_2.csv')

json.dump({'RARE_AF': RARE_AF, 'SPLICEAI_MIN': SPLICEAI_MIN, 'CADD_MIN': CADD_MIN, 'TOP_N': TOP_N,
           'consequence_source': 'worst term in Consequence_terms of the MANE Select transcript (v2.2 fix)',
           'inputs': ['S04_VEP_gnomAD/vep_annotation_v2.csv', 'S02B_ClinVar_phenotype/clinvar_phenotype_stratified_v2.csv', 'S01B_gene_validity/gene_validity_summary_v2_1.csv']},
          open(f'{OUT}/prioritization_rules_v2_2.json', 'w'), indent=2)

# ---------- report ----------
pd.set_option('display.width', 260); pd.set_option('display.max_colwidth', 70)
print('\n=== REPORT ===')
print(d['Final_status'].value_counts().to_string())
print('\nPer-gene summary:'); print(g.to_string())
print('\nTop candidates:'); print(top[show].to_string(index=False))
print('\nSaved to:', OUT)

# ---------- v2.2 check: compare with v2.1 if present ----------
old_path = f'{BASE}/final/Stage_5_v2_1/variants_scored_all_v2_1.csv'   # legacy optional comparison; absent here -> skipped
if os.path.exists(old_path):
    o = pd.read_csv(old_path)[['Variation_ID', 'Final_status']].rename(columns={'Final_status': 'Status_v2_1'})
    cmp_ = d[['Gene', 'Variation_ID', 'HGVSc', 'Final_status']].merge(o, on='Variation_ID')
    print('\nRows whose status changed vs v2.1:'); print(cmp_[cmp_['Final_status'] != cmp_['Status_v2_1']].to_string(index=False))
