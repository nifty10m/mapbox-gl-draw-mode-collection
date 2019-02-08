(function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(["exports", "@turf/difference", "@turf/flatten", "@turf/intersect", "@turf/helpers", "@turf/rewind", "@turf/truncate"], factory);
  } else if (typeof exports !== "undefined") {
    factory(exports, require("@turf/difference"), require("@turf/flatten"), require("@turf/intersect"), require("@turf/helpers"), require("@turf/rewind"), require("@turf/truncate"));
  } else {
    var mod = {
      exports: {}
    };
    factory(mod.exports, global.difference, global.flatten, global.intersect, global.helpers, global.rewind, global.truncate);
    global.stamp = mod.exports;
  }
})(this, function (_exports, _difference, _flatten, _intersect, _helpers, _rewind, _truncate) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.stamp = stamp;
  _difference = _interopRequireDefault(_difference);
  _flatten = _interopRequireDefault(_flatten);
  _intersect = _interopRequireDefault(_intersect);
  _rewind = _interopRequireDefault(_rewind);
  _truncate = _interopRequireDefault(_truncate);

  function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

  function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

  function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

  function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

  function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

  /**
   * Takes a polygon base and a polygon mask and slices the base according to the mask
   *
   * @param originalPolygon The polygon to slice
   * @param mask The polygon to slice with
   * @returns {*} A FeatureCollection with the resulting Polygons. May be empty
   */
  function stamp(originalPolygon, mask) {
    var innerPolygon = (0, _intersect.default)(originalPolygon, mask);

    if (!innerPolygon) {
      return (0, _helpers.featureCollection)([originalPolygon]);
    } // Difference between polygons by clipping the second polygon from the first


    var outerPolygons = (0, _difference.default)(originalPolygon, mask);

    if (!outerPolygons) {
      // Polygon and mask are identical
      return (0, _helpers.featureCollection)([innerPolygon]);
    } // We have to truncate the inner polygon rings of the outer polygon, because intersect truncates as well


    var flattenedOuterPolygons = (0, _flatten.default)(outerPolygons).features;
    flattenedOuterPolygons.forEach(function (outerPolygon) {
      outerPolygon.geometry.coordinates.map(function (coords, index) {
        if (index !== 0) {
          return (0, _truncate.default)((0, _helpers.lineString)(coords), {
            precision: 6,
            mutate: true
          }).geometry.coordinates;
        }

        return coords;
      });
    });
    var slicedPolygons = (0, _helpers.featureCollection)([].concat(_toConsumableArray((0, _flatten.default)(innerPolygon).features), _toConsumableArray(flattenedOuterPolygons)));
    return (0, _rewind.default)(slicedPolygons);
  }
});