NDVI and LULC Change Detection Report
1. Project Overview
This report presents Land Use/Land Cover (LULC) classification and NDVI-based vegetation change analysis using Sentinel-2 MSI data processed in Google Earth Engine (GEE).
2. Study Area
Location: Arambagh, Hooghly (West Bengal, India)
Coordinates: approx. 22.88°N, 87.78°E
Characteristics: agricultural land, river systems, settlements.
3. Sentinel-2 Dataset
Bands used:
- B2 (Blue, 10m)
- B3 (Green, 10m)
- B4 (Red, 10m)
- B8 (NIR, 10m)
- B11 (SWIR1, 20m)
- B12 (SWIR2, 20m).
4. Spectral Indices Used
NDVI = (B8 - B4) / (B8 + B4)
NDBI = (B11 - B8) / (B11 + B8)
MNDWI = (B3 - B11) / (B3 + B11)
NDSLI = (B4 - B11) / (B4 + B11).
5. Methodology
1. Sentinel-2 image filtering and cloud masking.
2. Median composite creation.
3. Spectral index calculation.
4. Random Forest classification using training samples.
5. NDVI change detection between 2020 and 2024.
6. NDVI Results (2020 vs 2024)
Mean NDVI 2020: 0.365
Mean NDVI 2024: 0.317
Vegetation area decreased by ~11,538 ha, indicating vegetation decline.
