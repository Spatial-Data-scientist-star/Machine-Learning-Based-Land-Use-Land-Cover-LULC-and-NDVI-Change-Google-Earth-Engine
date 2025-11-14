// ----------------------------- 
// K-MEANS CLUSTERING + FIXED AREA GROUPING + LABELS/LEGEND
// -----------------------------

// 1) AOI (same as yours)
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
Map.addLayer(aoi, {color: 'red'}, 'AOI Boundary');

// 2) Cloud masking
function maskS2(image) {
  var qa = image.select('QA60');
  var cloudBit = 1 << 10;
  var cirrusBit = 1 << 11;
  var mask = qa.bitwiseAnd(cloudBit).eq(0).and(qa.bitwiseAnd(cirrusBit).eq(0));
  return image.updateMask(mask).divide(10000).copyProperties(image, ['system:time_start']);
}

// 3) Composite
var comp = ee.ImageCollection('COPERNICUS/S2_HARMONIZED')
  .filterBounds(aoi)
  .filterDate('2021-01-01', '2024-12-31')
  .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 30))
  .map(maskS2)
  .median()
  .clip(aoi);
Map.addLayer(comp, {bands:['B4','B3','B2'], min:0.04, max:0.3}, 'RGB Composite');

// 4) Bands + indices
var ndvi = comp.normalizedDifference(['B8','B4']).rename('NDVI');
var mndwi = comp.normalizedDifference(['B3','B11']).rename('MNDWI');
var ndbi = comp.normalizedDifference(['B11','B8']).rename('NDBI');

var segImage = comp.select(['B2','B3','B4','B8','B11','B12']).addBands([ndvi, mndwi, ndbi]).float();

// 5) Sampling and clustering
var samples = segImage.sample({region: aoi, scale: 10, numPixels: 5000, seed: 42, geometries: false});
var K = 8;
var clusterer = ee.Clusterer.wekaKMeans(K).train(samples);
var clustered = segImage.cluster(clusterer).clip(aoi).rename('cluster');

// fixed palette
var palette = ['#1f78b4','#33a02c','#e31a1c','#ff7f00','#6a3d9a','#a6cee3','#b2df8a','#fb9a99'];
Map.addLayer(clustered, {min:0, max:K-1, palette: palette}, 'KMeans Clusters');

// -----------------------------
// 6) Correct area-per-cluster (pixelArea must be first band; groupField index is 1)
// -----------------------------
var pixelArea = ee.Image.pixelArea(); // band name: "area" implicitly
// create image with pixelArea FIRST, then cluster band SECOND
var areaAndCluster = pixelArea.addBands(clustered.rename('cluster'));

// group reducer: sum of first band (pixel area) grouped by second band (cluster)
var clusterStats = areaAndCluster.reduceRegion({
  reducer: ee.Reducer.sum().group({groupField: 1, groupName: 'cluster'}),
  geometry: aoi,
  scale: 10,
  maxPixels: 1e13
});
print('Raw clusterStats dictionary:', clusterStats);

// Convert group list to FeatureCollection (areas in hectares)
var groups = ee.List(clusterStats.get('groups'));
var areaTable = groups.map(function(g){
  g = ee.Dictionary(g);
  var cl = ee.Number(g.get('cluster'));
  var area_m2 = ee.Number(g.get('sum'));
  var area_ha = area_m2.divide(10000);
  return ee.Feature(null, {'cluster': cl, 'area_ha': area_ha});
});
areaTable = ee.FeatureCollection(areaTable);
print('Cluster areas (ha):', areaTable);

// -----------------------------
// 7) Create vector polygons for clusters, then centroids for labels
//    Use Reducer.first() to avoid the "mode" band-count problem
// -----------------------------
var vectors = clustered.reduceToVectors({
  geometry: aoi,
  scale: 10,
  geometryType: 'polygon',
  labelProperty: 'cluster',
  reducer: ee.Reducer.first()
});

// compute centroids and attach cluster id
var centroids = vectors.map(function(f){
  var c = ee.Number(f.get('cluster'));
  return ee.Feature(f.geometry().centroid(), {'cluster': c});
});
Map.addLayer(vectors, {color:'000000'}, 'Cluster polygons (vector)');
// Add centroid points (clickable)
Map.addLayer(centroids, {color:'white'}, 'Cluster centroids (click to inspect)');

// -----------------------------
// 8) Add a legend UI with colors and cluster IDs (text labels)
// -----------------------------
var legend = ui.Panel({style:{position:'bottom-left', padding:'8px 8px'}});
legend.add(ui.Label({value: 'K-Means clusters (ID : color)', style:{fontWeight:'bold'}}));

for (var i=0; i < K; i++){
  var colorBox = ui.Label('', {backgroundColor: palette[i], padding:'8px', margin:'0 4px 0 0'});
  var label = ui.Label('Cluster ' + i, {margin:'0 0 0 6px'});
  var row = ui.Panel([colorBox, label], ui.Panel.Layout.Flow('horizontal'));
  legend.add(row);
}
Map.add(legend);

// -----------------------------
// Optional: Export area table as CSV
// -----------------------------
Export.table.toDrive({
  collection: areaTable,
  description: 'KMeans_cluster_areas_ha',
  fileFormat: 'CSV'
});
