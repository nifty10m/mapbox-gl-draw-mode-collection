Mapbox GL Draw Mode Collection
==========================

<style>
    .button-container {
        text-align: center;
        margin-top: 15px;
    }
    .button-container .btn {
        color: black;
        border: thin black solid;
    }
    #map {
        margin-bottom: 10px;
        width: 100%;
        height: 400px;
    }
    button {
        line-height: 34px;
        font-size: 14px;
        padding: 0 20px;
        border: none;
        -webkit-appearance: none;
        outline: none;
        background: #267CB9;
        color: white;
        border-radius: 4px;
        font-weight: lighter;
    }
</style>
<div>
    <div id="map"></div>
    <button id="stamp-btn">Stamp mode</button>
    <button id="transform-btn">Transform mode</button>

    <script src='https://api.tiles.mapbox.com/mapbox-gl-js/v0.52.0/mapbox-gl.js'></script>
    <link href='https://api.tiles.mapbox.com/mapbox-gl-js/v0.52.0/mapbox-gl.css' rel='stylesheet' />
    <link rel='stylesheet' href='https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-draw/v1.0.9/mapbox-gl-draw.css' type='text/css' />
    <script src='https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-draw/v1.0.9/mapbox-gl-draw.js'></script>
    <script type="text/javascript" src='https://unpkg.com/@nifty10m/mapbox-gl-draw-mode-collection'></script>

    <script type="text/javascript">
      mapboxgl.accessToken = 'pk.eyJ1IjoidGVtcHJhbm92YSIsImEiOiJjaWd0c3M2MW4wOHI2dWNrbzZ5dWo1azVjIn0.x5sm8OjRxO9zO_uUmxYEqg';
      var map = new mapboxgl.Map({
          container: 'map', // container id
          style: 'mapbox://styles/mapbox/light-v9',
          center: { lat: 51.27577393881535, lng: 10.707858561480293 },
          zoom: 4.4,
      });

      var drawnPolygon;

      var draw = new MapboxDraw({
          defaultMode: 'draw_polygon',
          displayControlsDefault: false,
          controls: {
              polygon: true,
              trash: true,
          },
          modes: Object.assign({
              'stamp': ModeCollection.StampMode,
              'transform': ModeCollection.TransformMode,
          }, MapboxDraw.modes),
      });
      map.addControl(draw);

      map.on('load', function () {
          map.addSource('mode-collection-features', {
              type: 'geojson',
              data: null
          });
          map.addLayer({
              id: 'mode-collection',
              source: 'mode-collection-features',
              type: 'line',
              paint: {
                  'line-color': '#000000',
                  'line-width': 1
              }
          });

          map.on('draw.create', (event) => {
              draw.deleteAll();
              drawnPolygon = event.features[0];
              map.getSource('mode-collection-features').setData({
                  type: 'FeatureCollection',
                  properties: {},
                  features: event.features,
              });
          });

          document.getElementById('stamp-btn').addEventListener('click', function() {
              draw.changeMode('stamp', {
                  baseFeatureCollection: map.getSource('mode-collection-features')._data,
              });
          });

          document.getElementById('transform-btn').addEventListener('click', function() {
              var features = map.getSource('mode-collection-features')._data.features;
              var featureIds = draw.set({
                  type: 'FeatureCollection',
                  features: features,
              });

              draw.changeMode('transform', {
                  featureIds: featureIds,
                  boundary: drawnPolygon,
              });
          });

          map.on('draw.stamped', function(event) {
              map.getSource('mode-collection-features').setData({
                  type: 'FeatureCollection',
                  features: event.features,
              });
          });

          map.on('draw.update', function(event) {
              map.getSource('mode-collection-features').setData({
                  type: 'FeatureCollection',
                  features: event.features,
              });
          });

          map.on('draw.error', function(error) {
              console.log('stamp error', error);
          });
      });
    </script>
 </div>


This mode collection implements some useful modes for splitting and transforming polygons.

Installation
------------

### npm

```
npm install @nifty10m/mapbox-gl-draw-mode-collection

import { StampMode, TransformMode } from '@nifty10m/mapbox-gl-draw-mode-collection';
```

### browser

Get the js file from the `dist/` folder and include in your project.

```
<script type="text/javascript" src="mode-collection.min.js"></script>
```

## Usage

Ensure you are loading draw onto your map as a control before triggering `changeMode`.

```
var draw = new MapboxDraw(
 modes: Object.assign(
   'stamp': ModeCollection.StampMode,
   'transform': ModeCollection.TransformMode,
 }, MapboxDraw.modes)
});

map.addControl(draw);

/*
Activate the stamp mode with a base feature collection that should be stamped/split with a hand drawn polygon
*/

draw.changeMode('stamp', {
  baseFeatureCollection: someFeatureCollection
});

/*
Activate the transform mode with an array of feature IDs that are added to draw
*/

var featureIds = draw.set(someFeatureCollection);
draw.changeMode('transform', {
  featureIds: featureIds,
  boundary: someBoundary // optional,
});
```

## Events

### StampMode

* draw.stamped: emits the resulting split features as polygons
* draw.error: emits if an error occured during stamp mode

### TransformMode

* draw.transform: emits all features that are added to draw after the transformation was applied
