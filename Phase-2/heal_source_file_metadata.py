#!/usr/bin/env python3
"""
Heal Missing Source_File Metadata
==================================

This script fills missing Source_File values in GAID_MASTER_V2_COMPILATION_FINAL.csv
based on Dataset values.

Rules:
- If Dataset is "IEA Energy and AI Observatory", set Source_File to:
  https://iea.blob.core.windows.net/assets/601eaec9-ba91-4623-819b-4ded331ec9e8/EnergyandAI.pdf
- If Dataset is "UNESCO RAM", set Source_File to:
  https://www.unesco.org/en/ethics-ai/observatory
"""

import pandas as pd
import numpy as np
from pathlib import Path

# File path
CSV_FILE = Path(__file__).parent / "GAID_MASTER_V2_COMPILATION_FINAL.csv"

# Mapping rules
DATASET_SOURCE_FILE_MAPPING = {
    "IEA Energy and AI Observatory": "https://iea.blob.core.windows.net/assets/601eaec9-ba91-4623-819b-4ded331ec9e8/EnergyandAI.pdf",
    "UNESCO RAM": "https://www.unesco.org/en/ethics-ai/observatory"
}

def main():
    print("=" * 70)
    print("HEALING MISSING SOURCE_FILE METADATA")
    print("=" * 70)
    
    if not CSV_FILE.exists():
        print(f"ERROR: File not found: {CSV_FILE}")
        return
    
    # Load the CSV
    print(f"\nLoading CSV: {CSV_FILE.name}")
    df = pd.read_csv(CSV_FILE, encoding='utf-8', low_memory=False)
    
    initial_row_count = len(df)
    print(f"  Initial row count: {initial_row_count:,}")
    
    # Check initial missing values
    initial_missing_source_file = df['Source_File'].isna().sum()
    initial_empty_source_file = (df['Source_File'] == '').sum()
    total_initial_missing = initial_missing_source_file + initial_empty_source_file
    
    print(f"\nBefore fix:")
    print(f"  Missing Source_File (NaN): {initial_missing_source_file}")
    print(f"  Empty Source_File (''): {initial_empty_source_file}")
    print(f"  Total missing Source_File: {total_initial_missing}")
    
    if total_initial_missing > 0:
        print(f"\n  Missing values by Dataset:")
        missing_mask = df['Source_File'].isna() | (df['Source_File'] == '')
        missing_by_dataset = df[missing_mask]['Dataset'].value_counts()
        for dataset, count in missing_by_dataset.items():
            print(f"    {dataset}: {count}")
    
    # Apply fixes
    print(f"\nApplying fixes...")
    fixed_count = 0
    
    for dataset, source_file_url in DATASET_SOURCE_FILE_MAPPING.items():
        # Find rows where Dataset matches and Source_File is missing (NaN or empty)
        mask = (df['Dataset'] == dataset) & (df['Source_File'].isna() | (df['Source_File'] == ''))
        count = mask.sum()
        
        if count > 0:
            df.loc[mask, 'Source_File'] = source_file_url
            fixed_count += count
            print(f"  Fixed {count} rows for Dataset: '{dataset}'")
    
    print(f"  Total rows fixed: {fixed_count}")
    
    # Verification
    print(f"\nAfter fix:")
    final_missing_source_file = df['Source_File'].isna().sum()
    final_empty_source_file = (df['Source_File'] == '').sum()
    total_final_missing = final_missing_source_file + final_empty_source_file
    
    print(f"  Missing Source_File (NaN): {final_missing_source_file}")
    print(f"  Empty Source_File (''): {final_empty_source_file}")
    print(f"  Total missing Source_File: {total_final_missing}")
    
    # Check for any NaN values in entire dataframe
    total_nan_count = df.isna().sum().sum()
    print(f"\nVerification:")
    print(f"  Total NaN values in entire dataframe: {total_nan_count}")
    
    final_row_count = len(df)
    print(f"  Final row count: {final_row_count:,}")
    
    if final_row_count != initial_row_count:
        print(f"  WARNING: Row count changed from {initial_row_count:,} to {final_row_count:,}")
    else:
        print(f"  ✓ Row count unchanged (no data lost)")
    
    if total_final_missing == 0 and total_nan_count == 0:
        print(f"\n✓ SUCCESS: All missing Source_File values have been filled!")
        print(f"✓ No NaN values remain in the dataframe")
    else:
        print(f"\n⚠ WARNING: Some missing values remain")
        if total_final_missing > 0:
            print(f"  Still missing {total_final_missing} Source_File values")
        if total_nan_count > 0:
            print(f"  Still have {total_nan_count} NaN values in dataframe")
    
    # Save the updated file
    print(f"\nSaving updated file...")
    df.to_csv(CSV_FILE, index=False, encoding='utf-8')
    print(f"✓ Updated CSV saved to: {CSV_FILE}")
    print(f"\n" + "=" * 70)
    print("PROCESS COMPLETED")
    print("=" * 70)

if __name__ == "__main__":
    main()
