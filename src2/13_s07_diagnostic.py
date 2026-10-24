# Extracted verbatim from notebooks/Final_Organized_A_full_rerun.ipynb (cell 27): S07 diagnostic
# Requires the setup step (00) to have set PROJECT_BASE and RAW_DIR environment variables.
# Diagnostic: do the raw XMLs of the 'no testis IHC' genes contain ANY testis data?
import os
import pandas as pd, xml.etree.ElementTree as ET
from collections import Counter
BASE = os.environ['PROJECT_BASE']
RAWDIR = os.environ['RAW_DIR'] + '/hpa'; OUT = f'{BASE}/final/S07_HPA'
df = pd.read_csv(f'{OUT}/hpa_protein_expression_v2_1.csv')
strip = lambda t: t.split('}')[-1]
for gene in ['SYCP2','MSH4','MSH5','TERB1','NR5A1','MEIOB','XRCC2','M1AP']:
    ensg = df.loc[df.Gene == gene, 'Ensembl_Gene_ID'].iloc[0]
    root = ET.fromstring(open(f'{RAWDIR}/{ensg}.xml', 'rb').read())
    parent = {c: p for p in root.iter() for c in p}
    n_ab = sum(1 for e in root.iter() if strip(e.tag) == 'antibody')
    hits = Counter()
    for el in root.iter():
        if (el.text or '').strip().lower() == 'testis':
            path, n = [strip(el.tag)], el
            while n in parent:
                n = parent[n]
                t = strip(n.tag)
                path.append(t + (str(dict(n.attrib)) if t == 'tissueExpression' else ''))
            hits[' < '.join(path[:5])] += 1
    print(f'\n[{gene}] antibodies in XML: {n_ab}')
    for k, v in hits.items():
        print(f'   {v}x  {k}')
    if not hits:
        print('   no element with text "testis" at all')
