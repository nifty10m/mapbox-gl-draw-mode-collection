const point = require('@turf/helpers').point;
const booleanPointInPolygon = require('@turf/boolean-point-in-polygon').default;

function eventToPoint(event) {
    const { lngLat: { lng, lat } } = event;
    return point([lng, lat]);
}

function eventInside(event, polygon, opts) {
    return booleanPointInPolygon(eventToPoint(event), polygon, opts);
}

module.exports = eventInside;
