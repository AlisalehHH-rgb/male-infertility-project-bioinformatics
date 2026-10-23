# Extracted verbatim from notebooks/Final_Organized_A_full_rerun.ipynb (cell 25): S07 patch v2.1 (re-reads cached raw files)
# Requires the setup step (00) to have set PROJECT_BASE and RAW_DIR environment variables.
# STAGE 7 patch (v2.1): re-read cached raw HPA files, NO new downloads.
# Fixes: (1) normal-tissue IHC only (assayType='tissue'), (2) correct nCPM key,
# (3) adds testis cell-type fields that HPA provides.
import os, json
import pandas as pd
import xml.etree.ElementTree as ET

BASE = os.environ['PROJECT_BASE']
RAWDIR = os.environ['RAW_DIR'] + '/hpa'; OUT = f'{BASE}/final/S07_HPA'
NA = 'Not available'
df = pd.read_csv(f'{OUT}/hpa_protein_expression_v2.csv')

def strip(t): return t.split('}')[-1]
def kids(el, n): return [c for c in el if strip(c.tag) == n]
def ktext(el, n):
    k = kids(el, n); return (k[0].text or '').strip() if k else ''
RANK = {'not detected': 0, 'low': 1, 'medium': 2, 'high': 3}
INV = {v: k for k, v in RANK.items()}

def best(levels):
    st = [t for ty, t in levels if ty == 'staining'] or [t for _, t in levels]
    r = [RANK.get(t.lower(), -1) for t in st]
    return max(r) if r else -1

def recs_of(te):
    out = []
    for data in te.iter():
        if strip(data.tag) != 'data': continue
        tissue = ktext(data, 'tissue')
        if not tissue: continue
        cells = kids(data, 'tissueCell')
        if not cells:
            out.append((tissue, '', [(l.get('type', ''), (l.text or '').strip()) for l in kids(data, 'level')]))
        for tc in cells:
            out.append((tissue, ktext(tc, 'cellType'),
                        [(l.get('type', ''), (l.text or '').strip()) for l in kids(tc, 'level')]))
    return out

def fmt(recs, tissue):
    seen, parts = set(), []
    for t, c, lv in recs:
        if t.lower() == tissue:
            s = f"{c or 'tissue-level'}=" + ','.join(f'{a}:{b}' for a, b in lv)
            if s not in seen: seen.add(s); parts.append(s)
    return '; '.join(parts) if parts else NA

def normal_ihc(path):
    root = ET.fromstring(open(path, 'rb').read())
    ab_of = {}
    for ab in root.iter():
        if strip(ab.tag) == 'antibody':
            for te in ab.iter():
                if strip(te.tag) == 'tissueExpression':
                    ab_of[id(te)] = ab.get('id') or 'unknown'
    entry, byab = [], {}
    for te in root.iter():
        if strip(te.tag) != 'tissueExpression' or te.get('assayType') != 'tissue':
            continue                      # <- cancer assays excluded
        rr = recs_of(te)
        if id(te) in ab_of: byab.setdefault(ab_of[id(te)], []).extend(rr)
        else: entry.extend(rr)
    allr = entry + [x for v in byab.values() for x in v]
    base, level_src = (entry, 'entry-level') if entry else (allr, 'antibody-level' if allr else 'none')
    tmax = {}
    for t, c, lv in base:
        tmax[t.lower()] = max(tmax.get(t.lower(), -1), best(lv))
    return {
        'Testis_IHC_normal_entry': fmt(entry, 'testis'),
        'Testis_IHC_normal_by_antibody': ' | '.join(f'{a}: {fmt(v, "testis")}' for a, v in byab.items()
                                                    if fmt(v, 'testis') != NA) or NA,
        'Testis_IHC_normal_max': INV.get(tmax.get('testis', -1), NA),
        'IHC_source_level': level_src,
        'Other_normal_tissues_High': ', '.join(sorted(t for t, v in tmax.items() if v == 3 and t != 'testis')) or 'None',
        'Other_normal_tissues_Medium': ', '.join(sorted(t for t, v in tmax.items() if v == 2 and t != 'testis')) or 'None',
    }

def s(v):
    if v is None or v == '' or v == []: return NA
    return json.dumps(v, ensure_ascii=False) if isinstance(v, (dict, list)) else str(v)

new = []
for _, r in df.iterrows():
    ensg = r['Ensembl_Gene_ID']
    d = json.load(open(f'{RAWDIR}/{ensg}.json', encoding='utf-8'))
    if isinstance(d, list): d = d[0]
    ent = d.get('RNA tissue specific nTPM')
    row = {
        'Gene': r['Gene'],
        'RNA_enriched_tissues_nTPM': s(ent),
        'Testis_among_RNA_enriched_tissues': ('Yes' if any('testis' in k.lower() for k in ent) else 'No') if isinstance(ent, dict) else NA,
        'RNA_tissue_cell_type_enrichment': s(d.get('RNA tissue cell type enrichment')),
        'SC_type_specificity': s(d.get('RNA single cell type specificity')),
        'SC_type_specific_nCPM': s(d.get('RNA single cell type specific nCPM')),
        'Protein_tissue_specificity': s(d.get('Protein tissue specificity')),
        'Protein_cell_type_specificity': s(d.get('Protein cell type specificity')),
        'IHC_reliability': s(d.get('Reliability (IH)')),
    }
    row.update(normal_ihc(f'{RAWDIR}/{ensg}.xml'))
    new.append(row)

out = pd.DataFrame(new)
keep = ['Gene', 'Ensembl_Gene_ID', 'RNA_tissue_specificity', 'RNA_tissue_distribution', 'Access_date']
final = df[[c for c in keep if c in df.columns]].merge(out, on='Gene')
final.to_csv(f'{OUT}/hpa_protein_expression_v2_1.csv', index=False)

pd.set_option('display.width', 250); pd.set_option('display.max_colwidth', 70)
print('\n=== v2.1 REPORT ===')
print(final[['Gene', 'RNA_tissue_specificity', 'Testis_among_RNA_enriched_tissues',
             'Testis_IHC_normal_max', 'IHC_reliability', 'IHC_source_level']].to_string(index=False))
print('\nRNA enriched tissues:')
print(final[['Gene', 'RNA_enriched_tissues_nTPM']].to_string(index=False))
print('\nTestis IHC (normal tissue only):')
print(final[['Gene', 'Testis_IHC_normal_entry']].to_string(index=False))
print('\nCell-type fields:')
print(final[['Gene', 'RNA_tissue_cell_type_enrichment', 'SC_type_specificity', 'Protein_cell_type_specificity']].to_string(index=False))
print('\nTemplate check (identical for all genes):',
      [c for c in final.columns if c not in ('Gene','Ensembl_Gene_ID','Access_date') and final[c].astype(str).nunique() == 1])
print('Saved:', f'{OUT}/hpa_protein_expression_v2_1.csv')
