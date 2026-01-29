# Phase 1: GAID Version 1 (1998–2025)
**Global Artificial Intelligence Indicator Database: Harmonization & Integrity**

## 🎯 Overview
Phase 1 involved the compilation, curation and documentation of a longitudinal panel dataset covering **214 unique countries and territories from 1998 to 2025**. This milestone addressed the "fragmentation gap" by unifying data from three core global AI databases into a single, standardized research repository.

## 🛠️ Technical Methodology
* **Source Integration:** Harmonized public-access data from Stanford’s AI Index, OECD.ai (AI Policy Observatory), and the Global Index on Responsible AI.
* **Clinical Cleaning:** Implemented a rigorous **123-step cleaning and deduplication pipeline** via the `master_compiler_FINAL.py` script to ensure data integrity.
* **Standardization:** Mapped all geographical entities to official **ISO3 identifiers** to ensure interoperable analysis across global research tools.

## 📊 Dataset Domains (Per Section 3 of Codebook)
The Version 1 dataset is categorized into the following eight thematic domains:
1. **Part 1: Diversity**
2. **Part 2: Economy**
3. **Part 3: Education**
4. **Part 4: Global AI Vibrancy Tool**
5. **Part 5: Policy and Governance**
6. **Part 6: Public Opinion**
7. **Part 7: Research and Development**
8. **Part 8: Responsible AI**
9. **Part 9: Other(s)**

## 📂 Engineering Artifacts
The following files in this directory represent the core data engineering of this phase:
* **`master_compiler_FINAL.py`**: The Python ingestion and cleaning engine used to process the raw datasets.
* **`MASTER_AI_DATA_COMPILATION_FINAL.csv`**: The finalized Version 1 panel dataset. **This dataset can be downloaded on Harvard Dataverse as linked below.**
* **`CODEBOOK_MASTER_AI_DATA.pdf`**: Official documentation detailing variable definitions, units, and source attribution.

---
**Official Dataset Archive:** [Harvard Dataverse (v1)](https://doi.org/10.7910/DVN/QYLYSA)
