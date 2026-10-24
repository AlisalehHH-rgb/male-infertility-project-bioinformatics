# Extracted verbatim from notebooks/Final_Organized_A_full_rerun.ipynb (cell 31): Final check - manifest of the organized files
# Requires the setup step (00) to have set PROJECT_BASE and RAW_DIR environment variables.
# Final check: size + SHA256 of every file written in the organized layout -> final/MANIFEST_run.csv
import os, hashlib, csv
BASE = os.environ['PROJECT_BASE']; RAW = os.environ['RAW_DIR']
def sha(p):
    h = hashlib.sha256()
    with open(p, 'rb') as fh:
        for b in iter(lambda: fh.read(1 << 20), b''): h.update(b)
    return h.hexdigest()
roots = [os.path.join(BASE, 'final', d) for d in sorted(os.listdir(os.path.join(BASE, 'final'))) if d.startswith('S0')] + [RAW, os.path.join(BASE, 'scripts')]
files = [os.path.join(BASE, 'final', f) for f in ('README.md', 'S01_MFGA_Outputs.zip', 'S01B_initial_list_Outputs.zip', 'S02_ClinVar_Outputs.zip')]
for r in roots:
    for dp, _, fs in os.walk(r):
        files += [os.path.join(dp, f) for f in sorted(fs)]
rows = [{'path': os.path.relpath(p, BASE), 'bytes': os.path.getsize(p), 'sha256': sha(p)} for p in files if os.path.isfile(p)]
with open(f'{BASE}/final/MANIFEST_run.csv', 'w', newline='') as fh:
    w = csv.DictWriter(fh, fieldnames=['path', 'bytes', 'sha256']); w.writeheader(); w.writerows(rows)
print(len(rows), 'files listed in final/MANIFEST_run.csv')
print('stage folders:', sorted({r['path'].split('/')[1] for r in rows if r['path'].startswith('final/S0') and r['path'].count('/') >= 2}))
