# Publishing the project on GitHub (web interface only)

This guide uses **only the GitHub website**. You do not need Git, GitHub Desktop, or any software installed on your laptop.

## 1. What you will upload

The ready folder is:

`C:\Users\VISION\Desktop\PROJECT_ALL_ELEMENTS\github-ready\male-infertility-project-bioinformatics`

It contains:

- `website2/` - the complete static website (78 files).
- `thesis2/` - the original thesis PDF.
- `results2/figures/` - 51 figures plus `figures_index.csv`.
- `results2/tables/` - 58 CSV tables plus `tables_index.csv`.
- `docs2/` - the English Google Drive index, English strengths report, preview and this guide.
- `.github/workflows/pages.yml` - automatic GitHub Pages deployment.
- `README.md` - the project description and links.

## 2. Open the repository

Go to:

https://github.com/AlisalehHH-rgb/male-infertility-project-bioinformatics

Sign in to your GitHub account.

## 3. Upload the files in batches

GitHub's web uploader accepts:

- up to **100 files** per upload;
- up to **25 MB** per file.

All current files are below 25 MB, so no Git LFS is needed.

For each batch:

1. Click **Add file -> Upload files**.
2. Drag the folder or files from the ready folder.
3. Write a short commit message.
4. Click **Commit changes**.

Recommended order:

1. `docs2/` (small, and contains the Drive index).
2. `thesis2/` (the original PDF).
3. `results2/tables/` (58 CSV files; one or two batches).
4. `results2/figures/` (51 images; one or two batches).
5. `website2/` (78 files; split into `website2/img/chimerax`, `website2/img/pymol`, and the rest if needed).
6. `.github/workflows/pages.yml` if it was not uploaded with the folder.

If dragging a folder does not preserve its subfolders, create the folder on GitHub first (**Add file -> Create new file**, type `folder/placeholder.txt`, commit), then upload the files into it.

## 4. Create the Pages workflow if needed

If `.github/workflows/pages.yml` is missing:

1. Click **Add file -> Create new file**.
2. In the file name box type: `.github/workflows/pages.yml`
3. Paste the workflow content from the ready folder.
4. Commit.

## 5. Enable GitHub Pages

1. Open **Settings -> Pages**.
2. Under **Build and deployment -> Source**, choose **GitHub Actions**.
3. Open the **Actions** tab and wait for **Deploy website to GitHub Pages**.
4. The site will be available at:

`https://alisalehhh-rgb.github.io/male-infertility-project-bioinformatics/`

If the first run fails because Pages was not enabled yet, enable it and re-run the workflow:
**Actions -> Deploy website to GitHub Pages -> Re-run all jobs**.

## 6. Google Drive links

The file `docs2/google-drive-links.md` contains a table of all 24 Drive folders with:

- folder name;
- direct link;
- execution track/tool;
- purpose;
- contents.

It is already linked from `README.md`. Do not upload the Drive folders themselves; link them. Make sure each folder is shared as **Anyone with the link -> Viewer**.

## 7. Images, tables and results

- `results2/figures/` - 51 images extracted from the thesis source, with an index.
- `results2/tables/` - 58 CSV tables, UTF-8 with BOM for Excel.
- `thesis2/PROJECT_FINAL.pdf` - the authoritative formatted thesis.

## 8. Final checks

- [ ] `README.md` displays correctly on the repository home page.
- [ ] `thesis2/PROJECT_FINAL.pdf` opens from GitHub.
- [ ] `results2/figures/` contains 51 images.
- [ ] `results2/tables/` contains 58 CSV files.
- [ ] `docs2/google-drive-links.md` opens and lists 24 folders.
- [ ] GitHub Pages shows the website.
- [ ] The Actions tab shows a green successful run.

## 9. Limits and troubleshooting

- 100 MB maximum per file with Git; 25 MB with the web uploader.
- 100 files maximum per web upload.
- Do not commit `github-ready.zip`; it is only a local backup. Attach it to a GitHub Release if needed.
- If a page returns 404, confirm that `website2/index.html` exists and that Pages source is **GitHub Actions**.
- If an image does not appear, wait a minute and refresh; GitHub caches rendered Markdown.
