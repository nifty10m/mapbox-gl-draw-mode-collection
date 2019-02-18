const difference = require('@turf/difference');
const flatten = require('@turf/flatten').default;
const intersect = require('@turf/intersect').default;
const featureCollection = require('@turf/helpers').featureCollection;
const lineString = require('@turf/helpers').lineString;
const rewind = require('@turf/rewind').default;
const truncate = require('@turf/truncate').default;
const doubleClickZoom = require('../util/double-click-zoom');

/**
 * Takes a polygon base and a polygon mask and slices the base according to the mask
 *
 * @param originalPolygon The polygon to slice
 * @param mask The polygon to slice with
 * @returns {*} A FeatureCollection with the resulting Polygons. May be empty
 */
const stamp = (originalPolygon, mask) => {
    const innerPolygon = intersect(originalPolygon, mask);
    if (!innerPolygon) {
        return featureCollection([originalPolygon]);
    }

    // Difference between polygons by clipping the second polygon from the first
    const outerPolygons = difference(originalPolygon, mask);
    if (!outerPolygons) {
        // Polygon and mask are identical
        return featureCollection([innerPolygon]);
    }

    // We have to truncate the inner polygon rings of the outer polygon, because intersect truncates as well
    const flattenedOuterPolygons = flatten(outerPolygons).features;
    flattenedOuterPolygons.forEach(outerPolygon => {
        outerPolygon.geometry.coordinates.map((coords, index) => {
            if (index !== 0) {
                return truncate(lineString(coords), { precision: 6, mutate: true }).geometry.coordinates;
            }
            return coords;
        });
    });

    const slicedPolygons = featureCollection([...flatten(innerPolygon).features, ...flattenedOuterPolygons]);
    return rewind(slicedPolygons);
};

const StampMode = { ...MapboxDraw.modes['draw_polygon'] };

const originalSetup = MapboxDraw.modes['draw_polygon'].onSetup;

StampMode.onSetup = function (options) {
    if (!options.baseFeatureCollection || !options.baseFeatureCollection.features.length) {
        throw new Error('Stamping mode requires a FeatureCollection to stamp on');
    }

    if (options.baseFeatureCollection.features.some((feature) => feature.geometry.type !== 'Polygon')) {
        throw new Error('Stamping mode is only supported for Polygons');
    }

    this.baseFeatureCollection = options.baseFeatureCollection;

    return originalSetup.apply(this, options);
};

StampMode.onStop = function (state) {
    this.updateUIClasses({ mouse: 'none' });
    doubleClickZoom.enable(this);
    this.activateUIButton();

    // check to see if we've deleted this feature
    if (this.getFeature(state.polygon.id) === undefined) {
        return;
    }

    // remove last added coordinate
    state.polygon.removeCoordinate(`0.${ state.currentVertexPosition }`);

    if (state.polygon.isValid()) {
        try {
            const stampedFeatures = [].concat.apply([],
                this.baseFeatureCollection.features.map((groundFeature) =>
                    stamp(groundFeature, state.polygon.toGeoJSON()).features)
            );
            this.map.fire('draw.stamped', {
                features: stampedFeatures
            });
            this.deleteFeature([state.polygon.id], { silent: true });
        } catch (error) {
            this.map.fire('draw.error', { error });
        }
    } else {
        this.deleteFeature([state.polygon.id], { silent: true });
        this.changeMode('simple_select', {}, { silent: true });
    }
};

module.exports = StampMode;
