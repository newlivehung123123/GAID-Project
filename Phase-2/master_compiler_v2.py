#!/usr/bin/env python3
"""
Master GAID v2 Compiler (Wave 1 + Wave 2 Merge)
================================================

This script merges the GAID Wave 1 Master file with 8 new Wave 2 ingestion files
while standardizing all country names and ISO3 codes.

Input Files:
- Master (Reference): MASTER_AI_DATA_COMPILATION_FINAL.csv
- 8 Wave 2 ingestion files from various modules

Output: GAID_MASTER_V2_COMPILATION.csv
"""

import pandas as pd
import numpy as np
import logging
from pathlib import Path
from typing import Dict, Set, Optional

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# File paths
BASE_DIR = Path(__file__).parent
WORKSPACE_DIR = BASE_DIR.parent

# Input files
MASTER_FILE = BASE_DIR / "MASTER_AI_DATA_COMPILATION_FINAL.csv"

INGESTION_FILES = {
    'MacroPolo': WORKSPACE_DIR / "1_macropolo_global_talent" / "gaid_v2_macropolo_ingestion.csv",
    'UNESCO': WORKSPACE_DIR / "2_unesco_ai_ethics_governance" / "gaid_v2_unesco_ingestion.csv",
    'IEA Energy': WORKSPACE_DIR / "3_iea_energy_ai" / "gaid_v2_iea_energy_ai_ingestion.csv",
    'Epoch AI': WORKSPACE_DIR / "4_epoch_ai_technical_trends" / "gaid_v2_epoch_ai_technical_trends_ingestion.csv",
    'Tortoise': WORKSPACE_DIR / "5. tortoise_media_ai_index" / "gaid_v2_tortoise_ingestion.csv",
    'WIPO': WORKSPACE_DIR / "6. wipo_ai_patent" / "gaid_v2_wipo_ingestion.csv",
    'Coursera': WORKSPACE_DIR / "7. coursera_ai_skills" / "gaid_v2_coursera_ingestion.csv",
    'World Bank': WORKSPACE_DIR / "8. world_bank_govtech" / "gaid_v2_wbg_govtech_ingestion.csv",
}

# Output file
OUTPUT_FILE = BASE_DIR / "GAID_MASTER_V2_COMPILATION.csv"

# GAID v2 Schema (11 columns)
GAID_SCHEMA = [
    'Year', 'Country', 'ISO3', 'Metric', 'Value', 'Dataset',
    'Source', 'Source_Category', 'Source_File', 'Source_Type', 'Source_Year'
]

# Legacy ISO3 code mappings
LEGACY_ISO3_MAPPINGS = {
    'ROM': 'ROU',  # Romania
    'ZAR': 'COD',  # Democratic Republic of the Congo
    'ADO': 'AND',  # Andorra
    'TMP': 'TLS',  # Timor-Leste
    'WBG': 'PSE',  # Palestine
}

# Country name normalization mappings (handle variations for same ISO3)
COUNTRY_NAME_NORMALIZATIONS = {
    'Federated States of Micronesia': 'Micronesia',
    'Micronesia, Fed. Sts.': 'Micronesia',
}

# Dataset to Source standardization mappings (for Wave 2 files)
DATASET_TO_SOURCE_MAPPINGS = {
    'UNESCO RAM': 'UNESCO Global AI Ethics and Governance Observatory',
    'IEA Energy and AI Observatory': "IEA's Energy and AI Observatory",
    'Epoch AI - GPU Clusters': 'Epoch AI',
    'Epoch AI - Benchmarks': 'Epoch AI',
    'Epoch AI - AI Model Database': 'Epoch AI',
    'Epoch AI - ML Hardware': 'Epoch AI',
    'Epoch AI - AI Company Reports': 'Epoch AI',
    'Epoch AI - AI Chip Sales': 'Epoch AI',
    'Epoch AI - Frontier Data Centers': 'Epoch AI',
    'Epoch AI - AI Usage Polling': 'Epoch AI',
    'Tortoise Media - Global AI Index': 'Tortoise Media - Global AI Index',
    'WIPO - AI Patent Landscapes': 'WIPO (World Intellectual Property Organisation)',
    'World Bank GovTech Maturity Index (GTMI)': 'World Bank GovTech Maturity Index (GTMI)',
}

# Source value to Source standardization mappings (direct URL/value replacements)
SOURCE_VALUE_MAPPINGS = {
    'https://macropolo.org/digital-projects/the-global-ai-talent-tracker/': 'MacroPolo Global AI Talent Tracker',
    'https://epochai.org/data/ml-model-database': 'Epoch AI',
}

# Source_Type values to standardize to 'csv'
SOURCE_TYPE_TO_CSV = {
    'Statistical Extraction': 'csv',
    'Web Extraction': 'csv',
    'Database Extraction': 'csv',
    'Report Extraction': 'csv',
    'PDF Report': 'csv',
    'Web Scraping': 'csv',
    'Manual Extraction/Scraping': 'csv',
    'Index Data': 'csv',
}

def load_master_file() -> pd.DataFrame:
    """Load the Master reference file and create ISO3 to Country mapping."""
    logger.info("=" * 70)
    logger.info("STEP 1: Loading Master Reference File")
    logger.info("=" * 70)
    
    if not MASTER_FILE.exists():
        logger.error(f"Master file not found: {MASTER_FILE}")
        raise FileNotFoundError(f"Master file not found: {MASTER_FILE}")
    
    logger.info(f"Loading Master file: {MASTER_FILE.name}")
    df_master = pd.read_csv(MASTER_FILE, encoding='utf-8')
    
    logger.info(f"  Loaded {len(df_master):,} rows from Master file")
    logger.info(f"  Unique countries: {df_master['Country'].nunique()}")
    logger.info(f"  Unique ISO3 codes: {df_master['ISO3'].nunique()}")
    
    # Ensure ISO3 is uppercase
    df_master['ISO3'] = df_master['ISO3'].astype(str).str.upper().str.strip()
    
    # Remove rows with invalid ISO3 codes (NaN, empty, or not 3 characters)
    df_master = df_master[df_master['ISO3'].str.len() == 3]
    df_master = df_master[df_master['ISO3'].str.match(r'^[A-Z]{3}$')]
    
    logger.info(f"  After cleaning: {len(df_master):,} rows")
    
    return df_master

def create_iso3_country_mapping(df_master: pd.DataFrame) -> Dict[str, str]:
    """Create a mapping dictionary from ISO3 to Country name from Master file."""
    logger.info("\nCreating ISO3 to Country mapping from Master file...")
    
    # Create mapping: ISO3 -> Country
    # If there are multiple country names for the same ISO3, take the most frequent one
    iso3_country_mapping = {}
    
    for iso3 in df_master['ISO3'].unique():
        country_names = df_master[df_master['ISO3'] == iso3]['Country'].unique()
        if len(country_names) == 1:
            iso3_country_mapping[iso3] = country_names[0]
        else:
            # If multiple country names exist for the same ISO3, use the most frequent
            country_counts = df_master[df_master['ISO3'] == iso3]['Country'].value_counts()
            iso3_country_mapping[iso3] = country_counts.index[0]
    
    logger.info(f"  Created mapping for {len(iso3_country_mapping)} ISO3 codes")
    
    return iso3_country_mapping

def apply_legacy_iso3_mappings(df: pd.DataFrame) -> pd.DataFrame:
    """Apply legacy ISO3 code mappings (ROM→ROU, ZAR→COD, etc.)."""
    df = df.copy()
    df['ISO3'] = df['ISO3'].astype(str).str.upper().str.strip()
    
    # Apply legacy mappings
    for old_code, new_code in LEGACY_ISO3_MAPPINGS.items():
        mask = df['ISO3'] == old_code
        if mask.any():
            count = mask.sum()
            logger.info(f"  Mapping {old_code} → {new_code}: {count} rows")
            df.loc[mask, 'ISO3'] = new_code
    
    return df

def standardize_country_names(df: pd.DataFrame, iso3_mapping: Dict[str, str], source_name: str) -> pd.DataFrame:
    """Standardize Country names based on ISO3 mapping from Master file."""
    df = df.copy()
    
    # Ensure ISO3 is uppercase and clean
    df['ISO3'] = df['ISO3'].astype(str).str.upper().str.strip()
    
    # Track unmapped ISO3 codes
    unmapped_iso3: Set[str] = set()
    
    # Update Country names based on ISO3 mapping
    def lookup_country(iso3: str) -> Optional[str]:
        if pd.isna(iso3) or iso3 == '' or len(str(iso3)) != 3:
            return None
        
        iso3_str = str(iso3).upper()
        
        # Check legacy mappings first
        if iso3_str in LEGACY_ISO3_MAPPINGS:
            iso3_str = LEGACY_ISO3_MAPPINGS[iso3_str]
        
        # Look up in Master mapping
        if iso3_str in iso3_mapping:
            return iso3_mapping[iso3_str]
        
        # If not found, mark as unmapped
        if iso3_str not in unmapped_iso3 and iso3_str not in LEGACY_ISO3_MAPPINGS.values():
            unmapped_iso3.add(iso3_str)
        return None
    
    # Apply standardization
    df['Country_Standardized'] = df['ISO3'].apply(lookup_country)
    
    # Update Country column where standardization was successful
    mask = df['Country_Standardized'].notna()
    df.loc[mask, 'Country'] = df.loc[mask, 'Country_Standardized']
    
    # Drop the temporary column
    df = df.drop(columns=['Country_Standardized'])
    
    # Log unmapped ISO3 codes
    if unmapped_iso3:
        logger.warning(f"  {source_name}: {len(unmapped_iso3)} unmapped ISO3 codes: {sorted(unmapped_iso3)}")
    
    return df

def load_ingestion_file(file_path: Path, source_name: str, iso3_mapping: Dict[str, str]) -> pd.DataFrame:
    """Load a Wave 2 ingestion file and standardize it."""
    logger.info(f"\nLoading {source_name}...")
    
    if not file_path.exists():
        logger.warning(f"  File not found: {file_path}")
        return pd.DataFrame(columns=GAID_SCHEMA)
    
    try:
        df = pd.read_csv(file_path, encoding='utf-8')
        logger.info(f"  Loaded {len(df):,} rows from {file_path.name}")
        
        # Ensure all required columns exist
        missing_cols = set(GAID_SCHEMA) - set(df.columns)
        if missing_cols:
            logger.error(f"  Missing columns: {missing_cols}")
            return pd.DataFrame(columns=GAID_SCHEMA)
        
        # Apply legacy ISO3 mappings
        df = apply_legacy_iso3_mappings(df)
        
        # Standardize country names
        df = standardize_country_names(df, iso3_mapping, source_name)
        
        # Ensure ISO3 is uppercase
        df['ISO3'] = df['ISO3'].astype(str).str.upper().str.strip()
        
        # Filter out rows with invalid ISO3 codes
        valid_mask = (df['ISO3'].str.len() == 3) & (df['ISO3'].str.match(r'^[A-Z]{3}$'))
        invalid_count = (~valid_mask).sum()
        if invalid_count > 0:
            logger.warning(f"  Removed {invalid_count} rows with invalid ISO3 codes")
        df = df[valid_mask]
        
        logger.info(f"  Final rows: {len(df):,}")
        
        return df
        
    except Exception as e:
        logger.error(f"  Error loading {file_path.name}: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return pd.DataFrame(columns=GAID_SCHEMA)

def main():
    """Main execution function."""
    logger.info("=" * 70)
    logger.info("GAID MASTER V2 COMPILER")
    logger.info("Wave 1 Master + 8 Wave 2 Ingestion Files")
    logger.info("=" * 70)
    
    # Step 1: Load Master file
    df_master = load_master_file()
    
    # Step 2: Create ISO3 to Country mapping
    logger.info("\n" + "=" * 70)
    logger.info("STEP 2: Creating ISO3 to Country Mapping")
    logger.info("=" * 70)
    iso3_mapping = create_iso3_country_mapping(df_master)
    
    # Step 3: Load and standardize all Wave 2 ingestion files
    logger.info("\n" + "=" * 70)
    logger.info("STEP 3: Loading and Standardizing Wave 2 Ingestion Files")
    logger.info("=" * 70)
    
    all_wave2_data = []
    source_counts = {}
    
    for source_name, file_path in INGESTION_FILES.items():
        df_source = load_ingestion_file(file_path, source_name, iso3_mapping)
        if len(df_source) > 0:
            all_wave2_data.append(df_source)
            source_counts[source_name] = len(df_source)
        else:
            source_counts[source_name] = 0
    
    # Step 4: Merge Master and Wave 2 data
    logger.info("\n" + "=" * 70)
    logger.info("STEP 4: Merging All Data")
    logger.info("=" * 70)
    
    # Prepare Master data
    df_master_clean = df_master[GAID_SCHEMA].copy()
    df_master_clean['ISO3'] = df_master_clean['ISO3'].astype(str).str.upper().str.strip()
    source_counts['Master (Wave 1)'] = len(df_master_clean)
    
    # Combine all dataframes
    all_dataframes = [df_master_clean] + all_wave2_data
    df_merged = pd.concat(all_dataframes, ignore_index=True)
    
    logger.info(f"  Total rows after merge: {len(df_merged):,}")
    
    # Step 5: Standardize Source and Source_Type
    logger.info("\n" + "=" * 70)
    logger.info("STEP 5: Standardizing Source and Source_Type")
    logger.info("=" * 70)
    
    initial_rows = len(df_merged)
    
    # Standardize Source column based on Source value (URL/value replacements)
    logger.info("  Standardizing Source column based on Source value...")
    source_value_changes = 0
    for source_value, standardized_source in SOURCE_VALUE_MAPPINGS.items():
        mask = df_merged['Source'] == source_value
        if mask.any():
            count = mask.sum()
            df_merged.loc[mask, 'Source'] = standardized_source
            source_value_changes += count
            logger.info(f"    Source '{source_value}': {count} rows → Source: {standardized_source}")
    
    logger.info(f"  Source value-based standardizations: {source_value_changes:,} rows")
    
    # Standardize Source column based on Dataset
    logger.info("\n  Standardizing Source column based on Dataset...")
    source_dataset_changes = 0
    for dataset_name, standardized_source in DATASET_TO_SOURCE_MAPPINGS.items():
        mask = df_merged['Dataset'] == dataset_name
        if mask.any():
            count = mask.sum()
            df_merged.loc[mask, 'Source'] = standardized_source
            source_dataset_changes += count
            logger.info(f"    Dataset '{dataset_name}': {count} rows → Source: {standardized_source}")
    
    # Handle Coursera datasets (any Dataset containing "Coursera")
    mask_coursera = df_merged['Dataset'].str.contains('Coursera', case=False, na=False)
    if mask_coursera.any():
        count_coursera = mask_coursera.sum()
        df_merged.loc[mask_coursera, 'Source'] = 'Coursera'
        source_dataset_changes += count_coursera
        logger.info(f"    Dataset contains 'Coursera': {count_coursera} rows → Source: Coursera")
    
    logger.info(f"  Source dataset-based standardizations: {source_dataset_changes:,} rows")
    logger.info(f"  Total Source standardizations: {source_value_changes + source_dataset_changes:,} rows")
    
    # Standardize Source_Type to 'csv' for specific values
    logger.info("\n  Standardizing Source_Type to 'csv' for specific values...")
    source_type_changes = 0
    for source_type_value, new_value in SOURCE_TYPE_TO_CSV.items():
        mask = df_merged['Source_Type'] == source_type_value
        if mask.any():
            count = mask.sum()
            df_merged.loc[mask, 'Source_Type'] = new_value
            source_type_changes += count
            logger.info(f"    Source_Type '{source_type_value}': {count} rows → Source_Type: {new_value}")
    
    logger.info(f"  Total Source_Type standardizations: {source_type_changes:,} rows")
    
    # Standardize country name variations (e.g., Micronesia variations)
    logger.info("\n  Standardizing country name variations...")
    country_name_changes = 0
    for old_name, new_name in COUNTRY_NAME_NORMALIZATIONS.items():
        mask = df_merged['Country'] == old_name
        if mask.any():
            count = mask.sum()
            df_merged.loc[mask, 'Country'] = new_name
            country_name_changes += count
            logger.info(f"    Country '{old_name}': {count} rows → Country: {new_name}")
    
    logger.info(f"  Total country name standardizations: {country_name_changes:,} rows")
    
    logger.info(f"  Rows processed: {initial_rows:,}")
    
    # Step 6: Deduplication
    logger.info("\n" + "=" * 70)
    logger.info("STEP 6: Deduplication")
    logger.info("=" * 70)
    
    initial_count = len(df_merged)
    
    # Remove duplicates based on Year, Country, and Metric
    duplicates = df_merged.duplicated(subset=['Year', 'Country', 'Metric'], keep='first')
    duplicate_count = duplicates.sum()
    
    if duplicate_count > 0:
        logger.info(f"  Found {duplicate_count:,} duplicate rows (Year, Country, Metric)")
        df_merged = df_merged[~duplicates]
    
    final_count = len(df_merged)
    logger.info(f"  Rows before deduplication: {initial_count:,}")
    logger.info(f"  Rows after deduplication: {final_count:,}")
    logger.info(f"  Duplicates removed: {initial_count - final_count:,}")
    
    # Step 7: Sorting
    logger.info("\n" + "=" * 70)
    logger.info("STEP 7: Sorting")
    logger.info("=" * 70)
    
    df_merged = df_merged.sort_values(['Year', 'Country', 'Metric'], ascending=[True, True, True])
    df_merged = df_merged.reset_index(drop=True)
    
    logger.info("  Sorted by: Year (ascending), Country (alphabetical), Metric (alphabetical)")
    
    # Step 8: Ensure correct column order
    df_merged = df_merged[GAID_SCHEMA]
    
    # Step 9: Save output
    logger.info("\n" + "=" * 70)
    logger.info("STEP 9: Saving Output")
    logger.info("=" * 70)
    
    df_merged.to_csv(OUTPUT_FILE, index=False, encoding='utf-8')
    logger.info(f"✓ Saved to: {OUTPUT_FILE}")
    logger.info(f"✓ Total rows: {len(df_merged):,}")
    logger.info(f"✓ Total columns: {len(df_merged.columns)}")
    
    # Step 9: Summary statistics
    logger.info("\n" + "=" * 70)
    logger.info("SUMMARY STATISTICS")
    logger.info("=" * 70)
    
    logger.info(f"\nTotal data points by source:")
    logger.info("-" * 70)
    logger.info(f"{'Source':<30} | {'Data Points':>15}")
    logger.info("-" * 70)
    
    for source_name in sorted(source_counts.keys(), key=lambda x: (x != 'Master (Wave 1)', x)):
        count = source_counts[source_name]
        logger.info(f"{source_name:<30} | {count:>15,}")
    
    logger.info("-" * 70)
    logger.info(f"{'TOTAL':<30} | {len(df_merged):>15,}")
    logger.info("=" * 70)
    
    logger.info(f"\nFinal Dataset Statistics:")
    logger.info(f"  Total rows: {len(df_merged):,}")
    logger.info(f"  Unique countries: {df_merged['Country'].nunique()}")
    logger.info(f"  Unique ISO3 codes: {df_merged['ISO3'].nunique()}")
    logger.info(f"  Unique metrics: {df_merged['Metric'].nunique()}")
    logger.info(f"  Year range: {int(df_merged['Year'].min())} - {int(df_merged['Year'].max())}")
    
    # Step 10: Verification - Print unique Source and Source_Type values
    logger.info("\n" + "=" * 70)
    logger.info("VERIFICATION: Unique Source and Source_Type Values")
    logger.info("=" * 70)
    
    logger.info("\nUnique Source values:")
    unique_sources = sorted(df_merged['Source'].unique())
    for source in unique_sources:
        count = len(df_merged[df_merged['Source'] == source])
        logger.info(f"  {source}: {count:,} rows")
    
    logger.info("\nUnique Source_Type values:")
    unique_source_types = sorted(df_merged['Source_Type'].unique())
    for source_type in unique_source_types:
        count = len(df_merged[df_merged['Source_Type'] == source_type])
        logger.info(f"  {source_type}: {count:,} rows")
    
    logger.info("\n" + "=" * 70)
    logger.info("COMPILATION COMPLETE")
    logger.info("=" * 70)

if __name__ == "__main__":
    main()
