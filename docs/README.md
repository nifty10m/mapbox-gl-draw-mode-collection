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
    <script type="text/javascript" src='dist/mode-collection.min.js'></script>

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
              console.log(features);
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


This implements a rotation mode in GL Draw. Module is still in active development.

Installation
------------

### npm

```
npm install mapbox-gl-draw-rotate-mode

import RotateMode from 'mapbox-gl-draw-rotate-mode';
```

### browser

Get the js file from the `dist/` folder and include in your project.

```
<script type="text/javascript" src="mapbox-gl-draw-rotate-mode.js"></script>
```

## Usage

Ensure you are loading draw onto your map as a control before triggering `changeMode`.

```
var draw = new MapboxDraw(
 defaultMode: 'RotateMode'
 modes: Object.assign(
   RotateMode: RotateMode
 }, MapboxDraw.modes)
});

map.addControl(draw);

/*
After load, or on events, activate or deactivate rotation:
*/

draw.changeMode('RotateMode');
draw.changeMode('simple_select');
```

## Events

Mapbox GL Draw Rotate Mode offers you a few events. Redefine these as you need.

```
RotateMode.rotatestart = function(selectedFeature,originalCenter) {
  console.log('ROTATESTART');
  console.log('feature: ',selectedFeature);
  console.log('center: ',originalCenter);
}

RotateMode.rotating = function(selectedFeature,originalCenter,lastMouseDown) {
  console.log('ROTATING');
  console.log('feature: ',selectedFeature);
  console.log('center: ',originalCenter);
  console.log('lastMouseDown: ',lastMouseDown);
}

RotateMode.rotateend = function(selectedFeature) {
  console.log('ROTATEEND');
  console.log('feature: ',selectedFeature);
}
```
