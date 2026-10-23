# Extracted verbatim from notebooks/Final_Organized_A_full_rerun.ipynb (cell 33): Comparison with the earlier results (Stage_* vs S0*)
# Requires the setup step (00) to have set PROJECT_BASE and RAW_DIR environment variables.
# COMPARISON: earlier results (final/Stage_*) vs this run (final/S0*). Read only - nothing is modified.
# CSV/TSV: same columns, same row count, same rows (order-independent). JSON: same content.
# Ignored: columns/keys about paths, dates, times, hashes; folder names Stage_* vs S0* inside text values.
# Report -> final/COMPARISON_old_vs_new.csv
import os, re, json, csv
import pandas as pd
BASE = os.environ['PROJECT_BASE']
PAIRS = [('Stage_1', 'S01_MFGA'), ('Stage_1B', 'S01B_gene_validity/initial_list'), ('Stage_1B_v2', 'S01B_gene_validity'),
         ('Stage_2', 'S02_ClinVar'), ('Stage_2_v2', 'S02B_ClinVar_phenotype'), ('Stage_4_v2', 'S04_VEP_gnomAD'),
         ('Stage_6_v2', 'S06_GTEx'), ('Stage_7_v2', 'S07_HPA'), ('Stage_5_v2_2', 'S05_prioritization')]
IGNORE = re.compile(r'path|dir|folder|date|time|created|generated|run_at|sha|md5|hash|file', re.I)
FOLD = [(re.compile(re.escape(o) + r'(?![A-Za-z0-9_])'), n) for o, n in sorted(PAIRS, key=lambda p: -len(p[0]))]
def norm_text(v):
    if not isinstance(v, str): return v
    for rx, n in FOLD: v = rx.sub(n, v)
    return v.replace(BASE, '<BASE>')
def norm_json(o):
    if isinstance(o, dict): return {k: norm_json(v) for k, v in sorted(o.items()) if not IGNORE.search(str(k))}
    if isinstance(o, list): return [norm_json(v) for v in o]
    return norm_text(o)
def load_table(p):
    df = pd.read_csv(p, sep='\t' if p.endswith('.tsv') else ',', dtype=str, keep_default_na=False, low_memory=False)
    df = df[[c for c in df.columns if not IGNORE.search(c)]]
    return df.apply(lambda s: s.map(norm_text))
def compare(o, n):
    if o.endswith('.json'):
        a, b = norm_json(json.load(open(o, encoding='utf-8'))), norm_json(json.load(open(n, encoding='utf-8')))
        return ('IDENTICAL', '') if a == b else ('DIFFERENT', 'JSON content differs')
    a, b = load_table(o), load_table(n)
    if list(a.columns) != list(b.columns):
        if set(a.columns) != set(b.columns):
            return 'DIFFERENT', f'columns only old: {sorted(set(a.columns)-set(b.columns))[:5]} | only new: {sorted(set(b.columns)-set(a.columns))[:5]}'
        b = b[list(a.columns)]
    if len(a) != len(b): return 'DIFFERENT', f'rows old={len(a)} new={len(b)}'
    sa = a.sort_values(list(a.columns)).reset_index(drop=True); sb = b.sort_values(list(a.columns)).reset_index(drop=True)
    if sa.equals(sb):
        return ('IDENTICAL', f'{len(a)} rows') if a.reset_index(drop=True).equals(b.reset_index(drop=True)) else ('IDENTICAL (row order differs)', f'{len(a)} rows')
    diff = (sa != sb)
    cols = [c for c in a.columns if diff[c].any()]
    return 'DIFFERENT', f'{int(diff.any(axis=1).sum())} of {len(a)} rows differ; columns: {cols[:8]}'

rows = []
for old, new in PAIRS:
    od, nd = f'{BASE}/final/{old}', f'{BASE}/final/{new}'
    if not os.path.isdir(od):
        rows.append({'old': f'final/{old}', 'new': f'final/{new}', 'status': 'OLD FOLDER NOT FOUND', 'detail': ''}); continue
    for dp, dns, fs in os.walk(od):
        for f in sorted(fs):
            if not f.lower().endswith(('.csv', '.tsv', '.json')): continue
            o = os.path.join(dp, f); rel = os.path.relpath(o, od); n = os.path.join(nd, rel)
            r = {'old': f'final/{old}/{rel}', 'new': f'final/{new}/{rel}'}
            if not os.path.exists(n): r.update(status='MISSING IN NEW RUN', detail='')
            else:
                try: st, d = compare(o, n); r.update(status=st, detail=d)
                except Exception as e: r.update(status='NOT COMPARED (read error)', detail=str(e)[:200])
            rows.append(r)
with open(f'{BASE}/final/COMPARISON_old_vs_new.csv', 'w', newline='', encoding='utf-8') as fh:
    w = csv.DictWriter(fh, fieldnames=['old', 'new', 'status', 'detail']); w.writeheader(); w.writerows(rows)
from collections import Counter
print('Summary:', dict(Counter(r['status'] for r in rows)))
for r in rows:
    if not r['status'].startswith('IDENTICAL'): print(f"{r['status']:<28} {r['old']}  ->  {r['new']}  {r['detail']}")
print('Report:', f'{BASE}/final/COMPARISON_old_vs_new.csv')
