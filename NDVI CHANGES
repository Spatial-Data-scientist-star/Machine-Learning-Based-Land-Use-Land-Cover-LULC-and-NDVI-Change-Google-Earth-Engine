// =======================================================
// Compare NDVI: 2024 vs 2020 (median composites, cloud-masked)
// =======================================================

// ---------- 0. AOI (uncomment if you don't have 'aoi' defined) ----------
 var aoi = ee.Geometry.Polygon([
   [
    [87.61784545898368, 22.82693150871734],
   [87.6521777343743, 22.80288039900524],
  [87.72633544921806, 22.796550453875298],
   [87.83619873046806, 22.790220214813314],
     [87.8993701171868, 22.810475945081294],
    [87.9323291015618, 22.85983666774265],
     [87.9488085937493, 22.924358259137705],
     [87.89799682617118, 22.96356226130795],
     [87.8059863281243, 22.986320661956555],
     [87.73869506835868, 22.986320661956555],
     [87.67003051757743, 22.97114882067489],
     [87.63844482421806, 22.950917049812674],
     [87.6302050781243, 22.918033969817706],
     [87.61235229492118, 22.875020978301883],
     [87.61784545898368, 22.82693150871734]
   ]
 ]);

Map.centerObject(aoi, 10);

// ---------- 1. Helper: cloud mask for S2_HARMONIZED using QA60 ----------
function maskS2(image) {
  var qa = image.select('QA60');
  var cloudBit = 1 << 10;
  var cirrusBit = 1 << 11;
  var mask = qa.bitwiseAnd(cloudBit).eq(0).and(qa.bitwiseAnd(cirrusBit).eq(0));
  return image.updateMask(mask).divide(10000)
              .copyProperties(image, ['system:time_start']);
}

// ---------- 2. Function to build median composite for a given year ----------
function medianCompositeForYear(year, aoi, cloudThresh) {
  var start = ee.Date.fromYMD(year, 1, 1);
  var end = start.advance(1, 'year'); // exclusive end
  cloudThresh = cloudThresh || 40; // default cloudiness filter
  var coll = ee.ImageCollection('COPERNICUS/S2_HARMONIZED')
    .filterDate(start, end)
    .filterBounds(aoi)
    .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', cloudThresh))
    .map(maskS2)
    .select(['B4','B8']); // only need bands for NDVI (can add others)
  var med = coll.median().clip(aoi);
  return med;
}

// ---------- 3. Build composites for 2020 and 2024 ----------
var comp2020 = medianCompositeForYear(2020, aoi, 40);
var comp2024 = medianCompositeForYear(2024, aoi, 40);

// ---------- 4. Compute NDVI for each year ----------
var ndvi2020 = comp2020.normalizedDifference(['B8','B4']).rename('NDVI_2020');
var ndvi2024 = comp2024.normalizedDifference(['B8','B4']).rename('NDVI_2024');

// Add to map for quick QC
Map.addLayer(ndvi2020, {min:-0.5, max:1, palette: ['white','yellow','green']}, 'NDVI 2020');
Map.addLayer(ndvi2024, {min:-0.5, max:1, palette: ['white','yellow','green']}, 'NDVI 2024');

// ---------- 5. Compute NDVI difference (2024 - 2020) ----------
var ndviDiff = ndvi2024.subtract(ndvi2020).rename('NDVI_Difference');
Map.addLayer(ndviDiff, {min:-0.5, max:0.5, palette: ['red','white','green']}, 'NDVI Δ (2024 - 2020)');

// ---------- 6. Threshold to get meaningful increase/decrease masks ----------
var incThresh = 0.1; // NDVI increase threshold (tune as needed)
var decThresh = -0.1; // NDVI decrease threshold
var increased = ndviDiff.gt(incThresh).selfMask().rename('NDVI_increase');
var decreased = ndviDiff.lt(decThresh).selfMask().rename('NDVI_decrease');
Map.addLayer(increased, {palette: ['00ff00']}, 'NDVI Increase > 0.1');
Map.addLayer(decreased, {palette: ['ff0000']}, 'NDVI Decrease < -0.1');

// ---------- 7. Compute areas (hectares) of increase / decrease within AOI ----------
var pixelArea = ee.Image.pixelArea(); // in square meters

// area of increased pixels
var incAreaImage = pixelArea.updateMask(increased);
var incAreaSqM = incAreaImage.reduceRegion({
  reducer: ee.Reducer.sum(),
  geometry: aoi,
  scale: 10,
  maxPixels: 1e13
}).get('area'); // returns area band name 'area' or sum property

// area of decreased pixels
var decAreaImage = pixelArea.updateMask(decreased);
var decAreaSqM = decAreaImage.reduceRegion({
  reducer: ee.Reducer.sum(),
  geometry: aoi,
  scale: 10,
  maxPixels: 1e13
}).get('area');

print('NDVI increase (> ' + incThresh + ') area (sq.m):', incAreaSqM);
print('NDVI decrease (< ' + decThresh + ') area (sq.m):', decAreaSqM);

// Convert to hectares and print nicely
var incAreaHa = ee.Number(incAreaSqM).divide(10000);
var decAreaHa = ee.Number(decAreaSqM).divide(10000);
print('NDVI increase area (ha):', incAreaHa);
print('NDVI decrease area (ha):', decAreaHa);

// Also compute mean NDVI change over AOI
var meanDiff = ndviDiff.reduceRegion({
  reducer: ee.Reducer.mean(),
  geometry: aoi,
  scale: 10,
  maxPixels: 1e13
}).get('NDVI_Difference');
print('Mean NDVI change (2024 - 2020) over AOI:', meanDiff);

// ---------- 8. Optional: classify change into categories and display ----------
var changeClass = ndviDiff.expression(
  "(diff > th_inc) ? 1" + // increase
  ": (diff < th_dec) ? -1" + // decrease
  ": 0", {
    'diff': ndviDiff.select('NDVI_Difference'),
    'th_inc': incThresh,
    'th_dec': decThresh
  }
).rename('changeClass');
// Values: 1 = increase, 0 = no significant change, -1 = decrease
var changeVis = {min: -1, max: 1, palette: ['red', 'lightgray', 'green']};
Map.addLayer(changeClass, changeVis, 'Change class (-1,0,1)');

// ---------- 9. Export results to Google Drive (optional) ----------
Export.image.toDrive({
  image: ndviDiff,
  description: 'NDVI_Difference_2024_minus_2020',
  folder: 'LULC',
  fileNamePrefix: 'NDVI_Diff_2024_2020',
  region: aoi,
  scale: 10,
  crs: 'EPSG:4326',
  maxPixels: 1e13
});

Export.image.toDrive({
  image: changeClass,
  description: 'NDVI_ChangeClass_2024_2020',
  folder: 'LULC',
  fileNamePrefix: 'NDVI_ChangeClass_2024_2020',
  region: aoi,
  scale: 10,
  crs: 'EPSG:4326',
  maxPixels: 1e13
});

// ---------- 10. Notes for presentation / interpretation ----------
print('Notes:');
print(' - Thresholds (incThresh/decThresh) are user-defined. 0.1 is an example (meaningful vegetation change).');
print(' - Use the median composite to reduce cloud/season variability; you can also compute seasonal composites.');
print(' - Consider accuracy validation with ground truth or sample polygons if you derive LULC change from NDVI.');
