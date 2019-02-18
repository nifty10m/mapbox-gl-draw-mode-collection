function createMidpoint(parent, startVertex, endVertex, map) {
    const startCoord = startVertex.geometry.coordinates;
    const endCoord = endVertex.geometry.coordinates;

    // If a coordinate exceeds the projection, we can't calculate a midpoint,
    // so run away
    if (startCoord[1] > 85 ||
        startCoord[1] < -85 ||
        endCoord[1] > 85 ||
        endCoord[1] < -85) {
        return null;
    }

    const ptA = map.project([startCoord[0], startCoord[1]]);
    const ptB = map.project([endCoord[0], endCoord[1]]);
    const mid = map.unproject([(ptA.x + ptB.x) / 2, (ptA.y + ptB.y) / 2]);

    return {
        type: 'Feature',
        properties: {
            meta: 'midpoint',
            parent: parent,
            lng: mid.lng,
            lat: mid.lat,
            coord_path: endVertex.properties.coord_path
        },
        geometry: {
            type: 'Point',
            coordinates: [mid.lng, mid.lat]
        }
    };
}

module.exports = createMidpoint;
