# Gene Explorer website

Bilingual (Arabic/English), offline, static prototype of the male-infertility gene/variant evidence explorer.

## Run locally

Open `index.html` directly in Chrome, Edge, Firefox or Safari. No server, build step or installation is required. External database links need internet access; the site itself does not.

## Deploy (GitHub Pages)

The repository includes `.github/workflows/pages.yml`, which publishes the `website2/` folder to GitHub Pages on every push to `main`.

1. Open **Settings → Pages**.
2. Under **Build and deployment**, set **Source** to **GitHub Actions**.
3. Push to `main` or run the workflow manually.
4. The site will be available at `https://alisalehhh-rgb.github.io/male-infertility-project-bioinformatics/`.

## Contents

- `index.html` — entry page.
- `css/style.css` — styling.
- `js/app.js` — interactive UI.
- `js/stats.js` — in-browser statistics (Cochran's Q, exact McNemar, Holm, Bonferroni, Wilson, Jaccard, cluster bootstrap).
- `data/data.js` — project data (genes, variants, tool sets).
- `img/chimerax/`, `img/pymol/` — structural images.
- `img/bg/` — background artwork.
- `files/Colab_notebook_full_run.ipynb` — full Colab notebook.
