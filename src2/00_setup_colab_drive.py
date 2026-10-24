# Extracted verbatim from notebooks/Final_Organized_A_full_rerun.ipynb (cell 1): Full run with organized folders
# Requires the setup step (00) to have set PROJECT_BASE and RAW_DIR environment variables.
# SETUP (run first). Everything this notebook writes goes into the Drive folder "Final - Google Colab".

import os
if not os.path.ismount('/content/drive'):
    from google.colab import drive
    drive.mount('/content/drive')
assert os.path.ismount('/content/drive'), 'Drive is NOT mounted: stopping so nothing is written to a temporary local folder'

def find_folder(name):
    """Return every folder on My Drive (up to 4 levels deep) whose name is exactly `name`."""
    direct = f'/content/drive/MyDrive/{name}'
    if os.path.isdir(direct):
        return [direct]
    hits, root = [], '/content/drive/MyDrive'
    for dp, dns, _ in os.walk(root):
        if dp[len(root):].count(os.sep) >= 4:
            dns[:] = []; continue
        if name in dns: hits.append(os.path.join(dp, name))
    return hits

MAIN_NAME = 'Final - Google Colab'
main = find_folder(MAIN_NAME)
if len(main) != 1:
    raise RuntimeError(f'Expected exactly ONE folder named "{MAIN_NAME}" on Drive, found {len(main)}: {main}')

FRESH_DOWNLOADS = False   # False: reuse raw files already in "Final - Google Colab/raw" (ClinVar, GTEx, HPA, VEP/gnomAD cache)
                          # True : download everything again into "Final - Google Colab/raw_fresh"
os.environ['PROJECT_BASE'] = main[0]
os.environ['RAW_DIR'] = os.path.join(main[0], 'raw_fresh' if FRESH_DOWNLOADS else 'raw')
os.makedirs(os.environ['RAW_DIR'], exist_ok=True)
print('Outputs folder :', os.environ['PROJECT_BASE'])
print('Raw files      :', os.environ['RAW_DIR'], '(fresh downloads)' if FRESH_DOWNLOADS else '(existing files reused when present)')
