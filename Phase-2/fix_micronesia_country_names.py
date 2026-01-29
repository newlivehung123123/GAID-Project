#!/usr/bin/env python3
"""
Fix Micronesia Country Name Variations
======================================

This script fixes the duplicate country names for Micronesia (ISO3: FSM) in
GAID_MASTER_V2_COMPILATION.csv by standardizing both variations to "Micronesia".

Changes:
- "Federated States of Micronesia" → "Micronesia"
- "Micronesia, Fed. Sts." → "Micronesia"
"""

import pandas as pd
from pathlib import Path

# File path
CSV_FILE = Path(__file__).parent / "GAID_MASTER_V2_COMPILATION.csv"

def main():
    print("=" * 70)
    print("FIXING MICRONESIA COUNTRY NAME VARIATIONS")
    print("=" * 70)
    
    if not CSV_FILE.exists():
        print(f"ERROR: File not found: {CSV_FILE}")
        return
    
    # Load the CSV
    print(f"\nLoading CSV: {CSV_FILE.name}")
    df = pd.read_csv(CSV_FILE, encoding='utf-8')
    
    print(f"\nBefore fix:")
    fed_states_count = (df['Country'] == 'Federated States of Micronesia').sum()
    micronesia_fed_count = (df['Country'] == 'Micronesia, Fed. Sts.').sum()
    micronesia_count = (df['Country'] == 'Micronesia').sum()
    unique_countries = df['Country'].nunique()
    
    print(f"  'Federated States of Micronesia': {fed_states_count} rows")
    print(f"  'Micronesia, Fed. Sts.': {micronesia_fed_count} rows")
    print(f"  'Micronesia': {micronesia_count} rows")
    print(f"  Total unique countries: {unique_countries}")
    
    # Apply fixes
    df.loc[df['Country'] == 'Federated States of Micronesia', 'Country'] = 'Micronesia'
    df.loc[df['Country'] == 'Micronesia, Fed. Sts.', 'Country'] = 'Micronesia'
    
    print(f"\nAfter fix:")
    micronesia_count_after = (df['Country'] == 'Micronesia').sum()
    unique_countries_after = df['Country'].nunique()
    
    print(f"  'Micronesia': {micronesia_count_after} rows")
    print(f"  Total unique countries: {unique_countries_after}")
    
    # Save the fixed CSV
    df.to_csv(CSV_FILE, index=False, encoding='utf-8')
    print(f"\n✓ Fixed CSV saved to: {CSV_FILE}")
    print(f"✓ Reduced unique countries from {unique_countries} to {unique_countries_after}")
    print("=" * 70)

if __name__ == "__main__":
    main()
