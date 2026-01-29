# Phase 2: GAID Version 2 (Wave 1 Expansion)
**Automated Ingestion, Metadata Healing, and Geographic Standardization**

## 🎯 Overview
Phase 2 represents the technical scaling of the GAID infrastructure. This milestone focused on merging the original Wave 1 Version 1 dataset with new ingestion files from major global observatories (including UNESCO, IEA, Epoch AI, and Tortoise Media) to form a Wave 1 Version 2 dataset. This version expands the dataset to **227 unique countries and territories across 20 domains from 1998 to 2025** and **259,546 total rows**.

## 🛠️ Technical Pipeline (The "Code" Folder)
The transition from Version 1 to Version 2 is managed by a four-stage Python pipeline:

1. **`master_compiler_FINAL.py`**: The base engine that consolidates the original Stanford, GIRAI, and OECD datasets into Version 1.
2. **`master_compiler_v2.py`**: The primary integration script that merges the V1 Master file with 8 new Wave 2 ingestion files from various external modules.
3. **`fix_micronesia_country_names.py`**: A specialized geographic standardization script that resolves naming variations for Micronesia (ISO3: FSM) to ensure data consistency.
4. **`heal_source_file_metadata.py`**: A metadata enrichment script that fills missing source URLs for specific datasets like UNESCO RAM and IEA to ensure 100% auditability.

## 📊 Dataset Domains (Per Section 2 of Codebook, Part 1–20)
The Version 2 dataset is categorized into the following 20 thematic domains as defined in the official codebook:

* **Part 1: Diversity**
* **Part 2: Economy**
* **Part 3: Education**
* **Part 4: Global AI Vibrancy Tool**
* **Part 5: Policy and Governance**
* **Part 6: Public Opinion**
* **Part 7: Research and Development**
* **Part 8: Responsible AI**
* **Part 9: Economic/Strategic**
* **Part 10: Economic/Technological**
* **Part 11: Governance/Digital Infrastructure**
* **Part 12: Human Capital**
* **Part 13: Human Capital/Education**
* **Part 14: Innovation/Intellectual Property**
* **Part 15: Legal/Regulatory**
* **Part 16: Scientific/Educational**
* **Part 17: Social/Cultural**
* **Part 18: Social/Usage**
* **Part 19: Technological/Infrastructural**
* **Part 20: Other(s)**

## 📂 Engineering Artifacts
* **`GAID_MASTER_V2_COMPILATION_FINAL.csv`**: The finalized Version 2 master dataset. **This dataset can be downloaded on Harvard Dataverse as linked below.**
* **`w1_v2_CODEBOOK_MASTER_AI_DATA.pdf`**: Authoritative documentation detailing the 259,546 unique metrics and the Wave 1, Version 2 build process.

---
**Official Dataset Archive:** [Harvard Dataverse (v2)](https://doi.org/10.7910/DVN/PUMGYU)
