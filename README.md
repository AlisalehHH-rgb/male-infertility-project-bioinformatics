# Investigation of Genes Causing Male Infertility Using Bioinformatics Techniques

Graduation project, B.Sc. Biomedical Sciences, Damascus University.
Author: Ali Saleh. Supervisor: Dr. Marwan Alhalabi.

A retrospective in silico study of 16 validated male-infertility genes. It re-evaluates ClinVar pathogenic variants by matching each submission to the disease it was registered for, and integrates 13 layers of evidence into a traceable variant-level matrix. The work was carried out along three tracks (a Galaxy/VEP platform track, a Python/Colab programmatic track, and an AI-assisted track) and compared with paired statistics.

## Why it matters
- The genetic cause remains unknown in most men with infertility, and in non-obstructive azoospermia in particular.
- Public databases such as ClinVar list many "pathogenic" variants, but a variant labelled pathogenic may be registered for a different disease. A gene can be strongly linked to male infertility while most of its pathogenic variants belong to other conditions (for example AR, whose registrations are mostly androgen insensitivity and Kennedy disease).
- Matching each variant to its registered disease turns a long list of "pathogenic" variants into a disease-matched candidate list ready for functional validation.

## Detailed description

**Aim.** To test whether variants classified as pathogenic in genes with validated links to male infertility are registered for male infertility, and to build a reproducible, traceable evidence table of candidate variants for functional follow-up. The study re-examines variants already submitted to public databases and interprets them within the male-infertility context, as an interpretive layer that complements molecular diagnosis.

**Design.**
1. Gene selection: 37 candidate genes from the Male Fertility Gene Atlas; 16 retained with at least moderate gene-disease validity (Houston 2022; Zhao 2025).
2. Variant extraction: 6,157 ClinVar variants in candidate genes -> 726 pathogenic/likely pathogenic -> 712 in the 16 genes.
3. Disease matching at the level of each ClinVar submission (SCV): was the variant registered for male infertility or for another disease?
4. Annotation and filtering: Ensembl VEP, CADD >= 20, gnomAD v4 frequency <= 0.001, MANE Select transcripts.
5. Evidence layers: GTEx v8 and Human Protein Atlas expression, splice and missense predictors, NMD prediction, AlphaFold-based structural views (ChimeraX, PyMOL).
6. Prioritisation: 15 representative variants in 16 genes (8 stop-gain, 5 splice, 2 missense; CADD 27.2 to 46), with all groups and rules defined before looking at results and nine threshold scenarios tested.

**Output.** A disease-matched candidate list ready for functional validation, supported by a traceable, multi-layer evidence matrix.

## Pipeline (stages)
| Stage | Content | Script |
|---|---|---|
| S01 | Male Fertility Gene Atlas (MFGA) candidate genes | `src/02_s01_mfga.py` |
| S01B | Gene-disease validity (moderate or higher evidence) | `src/03_*`, `src/04_*` |
| S02 / S02B | ClinVar pathogenic / likely pathogenic extraction and phenotype stratification (submission level) | `src/05_*`, `src/06_*`, `src/07_*` |
| S04 | Ensembl VEP + gnomAD v4 (consequence, allele frequency) | `src/08_*`, `src/09_*` |
| S06 | GTEx v8 tissue expression | `src/10_*` |
| S07 | Human Protein Atlas (RNA and immunostaining) | `src/11_*` to `src/13_*` |
| S05 | Prioritisation (CADD, frequency, disease matching, MANE consequence fix) | `src/14_*` |
| Checks | Manifest and comparison with earlier results | `src/15_*`, `src/16_*` |

The full run is also available as one notebook: `notebooks/Final_Organized_A_full_rerun.ipynb` (Google Colab). The scripts in `src/` are the notebook's code cells, extracted unchanged.

## Three execution tracks, compared
1. **Platform track** (`track1_galaxy_vep/`): ClinVar on Galaxy, Ensembl VEP, and an Excel evidence matrix built with traceable formulas.
2. **Programmatic track** (`src/`, `notebooks/`): the same pipeline in Python on Google Colab. Core values matched track 1 exactly (469/469 CADD scores and 131/131 allele frequencies).
3. **AI-assisted track** (`track3_ai_tools/`): six AI tools/models received the same plan and were compared with a documented reference: Claude (Opus 5.5), Devin and Gemini 3 Pro with a single command; ChatGPT Plus and OpenCode (DeepSeek-V4-Flash) stage by stage; GPT-6 Astra, ChatGPT Plus and OpenCode on a verification task of 14 variants.

## Key results
- **177 of 712 (24.9%)** pathogenic variants are registered for male infertility.
- Disease matching changed **6 of 15** representative variants; moving the CADD threshold from 15 to 25 left all 15 unchanged across nine threshold scenarios.
- Final set: **15 representative variants in 16 genes**, all reproduced by the unified analysis.
- Reading raw files rather than summaries exposed errors made from memory and led to documented corrections (for example a GTEx value for MSH5 corrected from 3.10 to 34.60).
- Missense variants were analysed in detail in two versions (highest CADD, and CADD with disease matching) and visualised over AlphaFold models with ChimeraX and PyMOL.
- NMD was predicted for all eight stop-gain representatives.
- AI tools were compared with Cochran's Q, exact McNemar with Holm correction, Wilson intervals, Jaccard and a gene-clustered bootstrap (3,000 resamples); SHA-256 fingerprints audited the independence of each tool's outputs.
- A six-step protocol for comparing AI tools on genomic variant-prioritisation tasks was proposed.

## What makes the work strong
- **Submission-level disease matching:** each ClinVar submission (SCV) is read for the disease it was registered for, so gene-level strength is separated from variant-level evidence.
- **Pre-defined rules and sensitivity testing:** groups H (highest CADD), C (highest CADD among disease-matched) and M (strongest missense per gene) were defined before results; nine CADD/gnomAD scenarios gave the same 15 representatives.
- **Traceability and reproducibility:** a formula-driven Excel matrix (INDEX/MATCH across 48 sheets), SHA-256 fingerprints, a rerunnable Colab notebook, read-only inputs and corrections saved in new folders.
- **Thirteen integrated evidence layers:** ClinVar (SCV), CADD v1.7, gnomAD v4.1.1, SpliceAI, REVEL, AlphaMissense, LOFTEE, NMD, 1000 Genomes, OMIM, GTEx v8, HPA, AlphaFold/UniProt.
- **Detailed missense and structural analysis** with reproducible command files and pLDDT confidence values.
- **Three tracks compared with paired statistics** and a documented reference.
- **Website prototype:** an offline, bilingual (Arabic/English) evidence database with a "selection lab" that re-applies the rule when thresholds change, and an in-browser statistics engine (Cochran's Q, McNemar, Holm, Bonferroni, Wilson, Jaccard, bootstrap).
- **Mathematics and programming:** the Python pipeline, rule logic, formula-driven matrix, paired statistics and the JavaScript statistics engine all rest on mathematical and programming foundations.
- **Scale:** six chapters, 34 tables, 44 figures, more than 130 references, a 48-sheet Excel matrix and a log of 502 verified files.

## How to reproduce (Google Colab)
1. Create a Drive folder named exactly `Final - Google Colab` (the notebook looks for this name).
2. Open `notebooks/Final_Organized_A_full_rerun.ipynb` in Colab and run the first cell to mount Drive.
3. Set `FRESH_DOWNLOADS = True` in the setup cell to download all raw files again from the official sources (see `data/README.md`).
4. Run the cells in order. Outputs go to stage folders (S01_MFGA, S02_ClinVar, ...).

## Repository layout
```
notebooks/            Colab notebook (full run)
src/                  Python scripts, one per stage
track1_galaxy_vep/    Galaxy / VEP files and the Excel evidence matrix
track3_ai_tools/      the plan given to the AI tools and their outputs
structural_analysis/  ChimeraX / PyMOL command files and images
statistics/           statistical scripts and tables
website/              offline bilingual website prototype
data/                 final tables and data sources (raw files are downloaded from the official sources)
docs/                 strengths and novelty report, summaries
thesis/               project report (PDF)
```

## License and citation
Code: MIT (see `LICENSE`). Citation details: `CITATION.cff`.
