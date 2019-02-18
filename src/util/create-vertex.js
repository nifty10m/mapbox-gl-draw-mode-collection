function createVertex(parentId, coordinates, path, selected) {
    return {
        type: 'Feature',
        properties: {
            meta: 'vertex',
            parent: parentId,
            coord_path: path,
            active: (selected) ? 'true' : 'false'
        },
        geometry: {
            type: 'Point',
            coordinates: coordinates
        }
    };
}

module.exports = createVertex;
