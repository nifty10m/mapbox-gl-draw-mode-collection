(function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(["exports", "../util/stamp"], factory);
  } else if (typeof exports !== "undefined") {
    factory(exports, require("../util/stamp"));
  } else {
    var mod = {
      exports: {}
    };
    factory(mod.exports, global.stamp);
    global.stampMode = mod.exports;
  }
})(this, function (_exports, _stamp) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  var doubleClickZoom = {
    enable: function enable(ctx) {
      setTimeout(function () {
        // First check we've got a map and some context.
        if (!ctx.map || !ctx.map.doubleClickZoom || !ctx._ctx || !ctx._ctx.store || !ctx._ctx.store.getInitialConfigValue) {
          return;
        } // Now check initial state wasn't false (we leave it disabled if so)


        if (!ctx._ctx.store.getInitialConfigValue('doubleClickZoom')) {
          return;
        }

        ctx.map.doubleClickZoom.enable();
      }, 0);
    },
    disable: function disable(ctx) {
      setTimeout(function () {
        if (!ctx.map || !ctx.map.doubleClickZoom) {
          return;
        } // Always disable here, as it's necessary in some cases.


        ctx.map.doubleClickZoom.disable();
      }, 0);
    }
  };
  var StampMode = MapboxDraw.modes['draw_polygon'];
  var originalSetup = MapboxDraw.modes['draw_polygon'].onSetup;

  StampMode.onSetup = function (options) {
    if (!options.baseFeatureCollection || !options.baseFeatureCollection.features.length) {
      throw new Error('Stamping mode requires something to stamp on');
    }

    this.baseFeatureCollection = options.baseFeatureCollection;
    return originalSetup.apply(this, options);
  };

  StampMode.onStop = function (state) {
    this.updateUIClasses({
      mouse: 'none'
    });
    doubleClickZoom.enable(this);
    this.activateUIButton(); // check to see if we've deleted this feature

    if (this.getFeature(state.polygon.id) === undefined) {
      return;
    } // remove last added coordinate


    state.polygon.removeCoordinate("0.".concat(state.currentVertexPosition));

    if (state.polygon.isValid()) {
      try {
        var stampedFeatures = [].concat.apply([], this.baseFeatureCollection.features.map(function (groundFeature) {
          return (0, _stamp.stamp)(groundFeature, state.polygon.toGeoJSON()).features;
        }));
        this.map.fire('draw.stamped', {
          features: stampedFeatures
        });
        this.deleteFeature(state.polygon.id, {
          silent: true
        });
      } catch (error) {
        this.map.fire('draw.error');
      }
    } else {
      this.deleteFeature(state.polygon.id, {
        silent: true
      });
      this.changeMode('simple_select', {}, {
        silent: true
      });
    }
  };

  var _default = StampMode;
  _exports.default = _default;
});