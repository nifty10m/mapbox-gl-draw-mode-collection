const booleanClockwise = require('@turf/boolean-clockwise').default;
const booleanWithin = require('@turf/boolean-within').default;
const polygon = require('@turf/helpers').polygon;
const kinks = require('@turf/kinks').default;
const createSupplementaryPoints = require('../util/create-supplementary-points');
const doubleClickZoom = require('../util/double-click-zoom');
const eventInside = require('../util/event-inside');
const pointOnPolygonBorder = require('../util/point-on-polygon-border');

const TransformMode = { ...MapboxDraw.modes['direct_select'] };

TransformMode.getSelectedPoints = function(state, event) {
    const about = event.featureTarget.properties;
    const selectedPoint = about.meta === 'midpoint'
        ? [about.lng, about.lat]
        : this.getFeature(about.parent).getCoordinate(about.coord_path);

    const allFeaturePoints = state.features
        .map((feature) => createSupplementaryPoints(feature.toGeoJSON(), {
            midpoints: true,
            map: this.map,
            selectedPaths: [],
        }));

    return [].concat.apply([], allFeaturePoints)
        .filter((point) => {
            const coords = point.geometry.coordinates;
            return Math.abs(coords[0] - selectedPoint[0]) < 0.000001
                && Math.abs(coords[1] - selectedPoint[1]) < 0.000001;
        })
        .map((point) => {
            return point.properties;
        });
};

TransformMode.validMove = function(movedFeatures) {
    /*
        A move is considered valid if all resulting polygons fulfill the following requirements:
          * the polygon has no kinks
          * the polygon has no holes that were moved to the exterior
          * the polygon is still oriented counter-clockwise (this validates some moves regarding triangles)
    */
    const kinksFound = movedFeatures
        .map((feature) => feature.toGeoJSON())
        .some((feature) => !!kinks(feature).features.length);
    const holesMovedOutside = movedFeatures
        .map((feature) => feature.toGeoJSON())
        .filter((feature) => feature.geometry.coordinates.length > 1) // the polygon has a hole
        .some((feature) => {
            const boundary = polygon([feature.geometry.coordinates[0]]);
            const holes = feature.geometry.coordinates
                .filter((_, index) => index > 0)
                .map((rings) => polygon([rings]));
            return holes.some((hole) => !booleanWithin(hole, boundary));
        });
    const wrongOrientation = movedFeatures
        .map((feature) => feature.toGeoJSON())
        .some((feature) => booleanClockwise(feature.geometry.coordinates[0]));

    return !kinksFound && !holesMovedOutside && !wrongOrientation;
};

TransformMode.onVertex = function(state, event) {
    this.startDragging(state, event);

    state.selectedCoordPaths = this.getSelectedPoints(state, event);

    const selectedCoordinates = this.propertiesToCoordinates(state.selectedCoordPaths);
    this.setSelectedCoordinates(selectedCoordinates);
};

TransformMode.onMidpoint = function(state, event) {
    this.startDragging(state, event);

    const selectedPoints = this.getSelectedPoints(state, event);
    selectedPoints.forEach(({ parent, coord_path }) => {
        const feature = state.features.find(({ id }) => id === parent);
        feature.addCoordinate(coord_path, event.featureTarget.properties.lng, event.featureTarget.properties.lat);
    });

    this.fireUpdate();
    state.selectedCoordPaths = selectedPoints;
};

TransformMode.propertiesToCoordinates = function(properties) {
    return properties.map(({ parent, coord_path }) => ({ feature_id: parent, coord_path }));
};

TransformMode.dragVertex = function(state, event, delta) {
    const oldValues = [];
    const movedFeatures = [];

    state.selectedCoordPaths.forEach(({ parent, coord_path }) => {
        const feature = this.getFeature(parent);
        if (!feature) {
            return;
        }

        const coords = feature.getCoordinate(coord_path);

        oldValues.push({ id: parent, coord_path, coords });

        feature.updateCoordinate(coord_path, coords[0] + delta.lng, coords[1] + delta.lat);
        movedFeatures.push(feature);
    });

    if (!this.validMove(movedFeatures)) {
        oldValues.forEach(({ id, coord_path, coords }) => this.getFeature(id).updateCoordinate(coord_path, coords[0], coords[1]));
    }
};

TransformMode.clickNoTarget = function(state, event) {
    this.setSelected(state.featureIds);
};

TransformMode.clickInactive = function(state, event) {
    this.setSelected(state.featureIds);
};

TransformMode.clickActiveFeature = function(state) {
    state.selectedCoordPaths = [];
    this.clearSelectedCoordinates();
    state.features.forEach((feature) => feature.changed());
};

TransformMode.onSetup = function(opts) {
    const featureIds = opts.featureIds;
    const features = featureIds.map((id) => this.getFeature(id));

    if (!features.length) {
        throw new Error('You must provide at least one feature to enter transform mode');
    }
    if (features.some(({ type }) => type !== 'Polygon')) {
        throw new TypeError('transform mode only handles polygon features');
    }
    const state = {
        featureIds,
        features,
        dragMoveLocation: opts.startPos || null,
        dragMoving: false,
        canDragMove: false,
        dragBounds: opts.boundary,
        selectedCoordPaths: [], // These are not only paths but all the feature properties
    };
    this.setSelectedCoordinates(this.propertiesToCoordinates(state.selectedCoordPaths));
    this.setSelected(featureIds);
    doubleClickZoom.disable(this);
    this.setActionableState({
        trash: true
    });
    return state;
};

TransformMode.toDisplayFeatures = function(state, geojson, display) {
    if (state.featureIds.includes(geojson.properties.id)) {
        geojson.properties.active = 'true';
        display(geojson);
        createSupplementaryPoints(geojson, {
            map: this.map,
            midpoints: true,
            selectedPaths: []
        })
            .filter(pt => !state.dragBounds || !pointOnPolygonBorder(pt, state.dragBounds))
            .forEach(display);
    } else {
        geojson.properties.active = 'false';
        display(geojson);
    }
    this.fireActionable(state);
};

TransformMode.onDrag = function(state, event) {
    if (state.canDragMove !== true || (state.dragBounds && !eventInside(event, state.dragBounds))) {
        return;
    }
    state.dragMoving = true;
    event.originalEvent.stopPropagation();
    const delta = {
        lng: event.lngLat.lng - state.dragMoveLocation.lng,
        lat: event.lngLat.lat - state.dragMoveLocation.lat
    };
    if (state.selectedCoordPaths.length > 0) {
        this.dragVertex(state, event, delta);
    }
    state.dragMoveLocation = event.lngLat;
};

module.exports = TransformMode;
