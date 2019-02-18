Mapbox GL Draw Mode Collection
==========================

This mode collection implements some useful modes for splitting and transforming polygons.

If you find any bugs or want to improve something, feel free to submit a PR or open an issue.

Demo: https://nifty10m.github.io/mapbox-gl-draw-mode-collection/

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
