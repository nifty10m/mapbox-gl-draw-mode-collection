const createVertex = require('./create-vertex');
const createMidpoint = require('./create-midpoint');

function createSupplementaryPoints(geojson, options = {}, basePath = null) {
    const { type, coordinates } = geojson.geometry;
    const featureId = geojson.properties && (geojson.properties.id || geojson.id);

    const supplementaryPoints = [];

    if (type === 'Point') {
        // For points, just create a vertex
        supplementaryPoints.push(createVertex(featureId, coordinates, basePath, isSelectedPath(basePath)));
    } else if (type === 'Polygon') {
        // Cycle through a Polygon's rings and
        // process each line
        coordinates.forEach((line, lineIndex) => {
            processLine(line, (basePath !== null) ? `${basePath}.${lineIndex}` : String(lineIndex));
        });
    } else if (type === 'LineString') {
        processLine(coordinates, basePath);
    }

    function processLine(line, lineBasePath) {
        let firstPointString = '';
        let lastVertex = null;
        line.forEach((point, pointIndex) => {
            const pointPath = (lineBasePath !== undefined && lineBasePath !== null) ? `${lineBasePath}.${pointIndex}` : String(pointIndex);
            const vertex = createVertex(featureId, point, pointPath, isSelectedPath(pointPath));
            // If we're creating midpoints, check if there was a
            // vertex before this one. If so, add a midpoint
            // between that vertex and this one.
            if (options.midpoints && lastVertex) {
                const midpoint = createMidpoint(featureId, lastVertex, vertex, options.map);
                if (midpoint) {
                    supplementaryPoints.push(midpoint);
                }
            }
            lastVertex = vertex;

            // A Polygon line's last point is the same as the first point. If we're on the last
            // point, we want to draw a midpoint before it but not another vertex on it
            // (since we already a vertex there, from the first point).
            const stringifiedPoint = JSON.stringify(point);
            if (firstPointString !== stringifiedPoint) {
                supplementaryPoints.push(vertex);
            }
            if (pointIndex === 0) {
                firstPointString = stringifiedPoint;
            }
        });
    }

    function isSelectedPath(path) {
        if (!options.selectedPaths) {
            return false;
        }
        return options.selectedPaths.indexOf(path) !== -1;
    }

    return supplementaryPoints;
}

module.exports = createSupplementaryPoints;
