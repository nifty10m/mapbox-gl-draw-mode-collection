import difference from '@turf/difference';
import flatten from '@turf/flatten';
import intersect from '@turf/intersect';
import { featureCollection, lineString } from '@turf/helpers';
import rewind from '@turf/rewind';
import truncate from '@turf/truncate';

/**
 * Takes a polygon base and a polygon mask and slices the base according to the mask
 *
 * @param originalPolygon The polygon to slice
 * @param mask The polygon to slice with
 * @returns {*} A FeatureCollection with the resulting Polygons. May be empty
 */
export function stamp(originalPolygon, mask) {
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
}
