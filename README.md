# Machine-Learning-Based-Land-Use-Land-Cover-LULC-and-NDVI-Change-Google-Earth-Engine
Machine Learning-Based Land Use Land Cover (LULC) and NDVI Change Analysis Using Sentinel-2 Imagery for Arambagh Region on Google Earth Engine
// =====================
// Define Area of Interest (AOI)
// =====================

// Polygon created from your 15 coordinates
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
    [87.61784545898368, 22.82693150871734] // close the polygon
  ]
]);

// Center the map and visualize AOI
Map.centerObject(aoi, 10);
Map.addLayer(aoi, {color: 'red', fillColor: '00000000'}, 'AOI Boundary');

// Print info to console (optional)
print('AOI geometry:', aoi);
