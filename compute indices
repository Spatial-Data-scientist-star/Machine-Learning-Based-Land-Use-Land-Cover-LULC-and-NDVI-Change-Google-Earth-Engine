
// 1️⃣ Define AOI
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

// Load dataset (assuming AOI already defined)
var dataset = ee.ImageCollection("COPERNICUS/S2_HARMONIZED")
  .filterDate("2021-01-01", "2025-12-31")
  .filterBounds(aoi)
  .filter(ee.Filter.lt("CLOUDY_PIXEL_PERCENTAGE", 30))
  .median()
  .clip(aoi);

// Compute indices
var ndvi = dataset.normalizedDifference(["B8", "B4"]).rename("NDVI");
var mndwi = dataset.normalizedDifference(["B3", "B11"]).rename("MNDWI");
var ndbi = dataset.normalizedDifference(["B11", "B8"]).rename("NDBI");
var ndsli = dataset.normalizedDifference(["B4", "B11"]).rename("NDSLI");

// Combine indices with original bands
var segImg = dataset.addBands([ndvi, mndwi, ndbi, ndsli]);
print("Segmentation image bands:", segImg.bandNames());

// Visualize
Map.centerObject(aoi, 10);
Map.addLayer(segImg, {bands: ["B4","B3","B2"], min:0.04, max:0.3}, "Sentinel-2 RGB");
Map.addLayer(ndvi, {min:0, max:1, palette:["white","green"]}, "NDVI");
Map.addLayer(mndwi, {min:-1, max:1, palette:["blue","white"]}, "MNDWI");
Map.addLayer(ndbi, {min:-1, max:1, palette:["gray","red"]}, "NDBI");
Map.addLayer(ndsli, {min:-1, max:1, palette:["yellow","brown"]}, "NDSLI");
