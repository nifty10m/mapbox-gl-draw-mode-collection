const flatten = require('@turf/flatten').default;
const pointToLineDistance = require('@turf/point-to-line-distance').default;
const polygonToLineString = require('@turf/polygon-to-linestring').default;

function pointOnPolygonBorder(point, polygon) {
    return flatten(polygonToLineString(polygon))
        .features
        .some((lineString) => pointToLineDistance(point, lineString, { units: 'meters' }) < 0.01);
}

module.exports = pointOnPolygonBorder;
