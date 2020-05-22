(function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(["exports", "bezier-easing"], factory);
  } else if (typeof exports !== "undefined") {
    factory(exports, require("bezier-easing"));
  } else {
    var mod = {
      exports: {}
    };
    factory(mod.exports, global.bezierEasing);
    global.x = mod.exports;
  }
})(this, function (_exports, _bezierEasing) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports["default"] = void 0;
  _bezierEasing = _interopRequireDefault(_bezierEasing);

  function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

  function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

  function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(source, true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(source).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

  function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

  function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

  function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

  var easing = (0, _bezierEasing["default"])(0.250, 0.100, 0.250, 1.000);
  var easeOut = (0, _bezierEasing["default"])(0, 0, 0.58, 1);
  var easeIn = (0, _bezierEasing["default"])(0.42, 0, 1, 1);
  var quadratic = (0, _bezierEasing["default"])(0.25, 0.46, 0.45, 0.94);
  var circular = (0, _bezierEasing["default"])(0.1, 0.57, 0.1, 1);

  var XMScroll =
  /*#__PURE__*/
  function () {
    function XMScroll(el, options) {
      _classCallCheck(this, XMScroll);

      options = _objectSpread({}, XMScroll.defaults, {}, options);
      this.$el = el;
      this.$con = options.content ? options.content instanceof Node ? options.content : this.$el.querySelector(options.content) : this.$el.children[0];
      this.state = {
        enabled: true,
        // 是否启用
        touching: false,
        scrolling: false,
        bouncing: false,
        minX: 0,
        maxX: 0,
        width: 0,
        useTransform: options.useTransform,
        slowDownOverflow: options.slowDownOverflow,
        bounceTime: 600,
        x: 0
      };
      this.scrollingTimer = null;
      this.calctempStateTimer = null; // 当手指移动停止，且未离开屏幕时，一定时间后，将速度设置为0

      this.tempState = {
        lastTime: 0,
        lastX: 0,
        time: 0,
        x: 0,
        s: 0,
        // 移动距离
        t: 0,
        // 移动时间
        v: 0 // 速度

      };
      this._eventHandles = {};
      this.eventHandles = {};
      this.reset(options);
      this.initEvent();
    } // 重新计算滚动范围


    _createClass(XMScroll, [{
      key: "refresh",
      value: function refresh(options) {
        var oldState = _objectSpread({}, this.state);

        this.state.width = this.$el.clientWidth;
        this.state.maxX = this.$el.clientWidth - this.$con.offsetWidth;
        options && (this.state = _objectSpread({}, this.state, {}, options));

        if (oldState.minX !== this.state.minX || oldState.maxX !== this.state.maxX) {
          if (this.state.bouncing || !this.state.scrolling) {
            this.bounce();
          }
        }
      }
    }, {
      key: "reset",
      value: function reset(options) {
        this.refresh(options);
        this.translateTo(this.state.minX, false);
      } // 执行反弹

    }, {
      key: "bounce",
      value: function bounce() {
        var _this = this;

        this.stopScrolling();

        if (this.state.x <= this.state.minX && this.state.x >= this.state.maxX) {
          return;
        }

        this.state.scrolling = true;
        this.state.bouncing = true;
        var len = 0;

        if (this.state.x > this.state.minX) {
          len = this.state.minX - this.state.x;
        } else {
          len = this.state.maxX - this.state.x;
        }

        var x = this.state.x;
        var timeStart = 0;

        var _bounce = function _bounce(oldTime) {
          _this.setTimer(function (time) {
            if (oldTime) {
              var percent = (time - timeStart) / _this.state.bounceTime;
              if (percent > 1) percent = 1;

              _this.translateTo(x + easing(percent) * len);

              if (percent === 1) {
                _this.state.bouncing = false;

                _this.stopScrolling();

                return;
              }
            } else {
              timeStart = time;
            }

            _bounce(time);
          });
        };

        _bounce();
      }
    }, {
      key: "_addEvent",
      value: function _addEvent(name, handle) {
        var handles = this._eventHandles;

        if (!handles[name]) {
          handles[name] = [];
        }

        handles[name].push(handle);
        this.$el.addEventListener(name, handle);
      }
    }, {
      key: "_removeEvent",
      value: function _removeEvent(name, handle) {
        var _this2 = this;

        var handles = this._eventHandles;

        if (!name) {
          Object.keys(handles).forEach(function (name) {
            _this2._removeEvent(name);
          });
        }

        if (!handles[name]) return;

        if (!handle) {
          handles[name].forEach(function (h) {
            _this2.$el.removeEventListener(name, h);
          });
          handles[name] = [];
        } else {
          this.$el.removeEventListener(name, handle);
          var index = handles[name].findIndex(function (h) {
            return h === handle;
          });
          handles[name].splice(index, 1);
        }
      }
    }, {
      key: "initEvent",
      value: function initEvent() {
        var _this3 = this;

        this._removeEvent();

        this._addEvent("touchstart", function (e) {
          _this3.state.touching = true;

          _this3.stopScrolling();

          _this3.calctempState(e.timeStamp, e.targetTouches[0].screenX, true);

          _this3.trigger("touchstart", _this3.state);
        });

        this._addEvent("touchmove", function (e) {
          if (!_this3.state.enabled) return;
          e.preventDefault();

          if (_this3.state.touching) {
            _this3.calctempState(e.timeStamp, e.targetTouches[0].screenX);

            var len = _this3.tempState.s;

            if (_this3.state.x > _this3.state.minX || _this3.state.x < _this3.state.maxX) {
              len /= 3;
            }

            _this3.translate(len);

            _this3.setCalcTimer();
          }

          _this3.trigger("touchmove", _this3.state);
        });

        this._addEvent("touchend", function (e) {
          _this3.state.touching = false;

          _this3.removeCalcTimer();

          _this3.trigger("touchend", _this3.state);

          _this3.slowDown();
        });
      }
    }, {
      key: "calctempState",
      value: function calctempState(time, x) {
        var reset = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

        if (reset) {
          this.tempState = {
            startTime: time,
            startX: x,
            lastTime: 0,
            lastX: 0,
            time: 0,
            x: 0,
            s: 0,
            // 移动距离
            t: 0,
            // 移动时间
            v: 0 // 速度

          };
        }

        this.tempState.lastTime = this.tempState.time;
        this.tempState.lastX = this.tempState.x;
        this.tempState.time = time;
        this.tempState.x = x;

        if (!reset) {
          this.tempState.s = this.tempState.x - this.tempState.lastX;
          this.tempState.t = this.tempState.time - this.tempState.lastTime;
          this.tempState.v = this.tempState.s / this.tempState.t;
          this.tempState.ov = this.tempState.v;
        }
      }
    }, {
      key: "stopScrolling",
      value: function stopScrolling() {
        // 停止自动滚动（包括反弹滚动）
        if (this.scrollingTimer) {
          window.cancelAnimationFrame(this.scrollingTimer);
          this.scrollingTimer = null;
        }

        this.state.scrolling = false;
        this.state.bouncing = false;
      }
    }, {
      key: "setTimer",
      value: function setTimer(callback) {
        this.scrollingTimer = window.requestAnimationFrame(callback);
      }
    }, {
      key: "setCalcTimer",
      value: function setCalcTimer() {
        var _this4 = this;

        this.removeCalcTimer();
        this.calctempStateTimer = window.setTimeout(function () {
          _this4.calctempState(_this4.tempState.time + 100, _this4.tempState.x); // 将速度设置为0

        }, 100);
      }
    }, {
      key: "removeCalcTimer",
      value: function removeCalcTimer() {
        if (this.calctempStateTimer) {
          window.clearTimeout(this.calctempStateTimer);
          this.calctempStateTimer = null;
        }
      }
    }, {
      key: "slowDown",
      value: function slowDown() {
        var _this5 = this;

        // 减速停止
        if (this.state.x >= this.state.minX || this.state.x <= this.state.maxX) {
          this.bounce();
          return;
        }

        var v = this.tempState.v === 0 ? 0 : (this.tempState.x - this.tempState.startX) / (this.tempState.time - this.tempState.startTime); // this.tempState.v

        var startTime = Date.now();
        var startX = this.state.x;
        var a = 0.001;
        var time = Math.abs(v / a); // 减速时间 = 以当前速度做匀减速运动的时间

        var s = v * time / 2; // 匀减速距离

        var toX = startX + s;
        var limit = Math.abs(v) * 15;
        var minLimitX = this.state.minX + limit;
        var maxLimitX = this.state.maxX - limit; // if(toX > minLimitX) {
        //   s = minLimitX - startX
        //   time = s * 2 / v
        // } else if ( toX < maxLimitX) {
        //   s = maxLimitX - startX
        //   time = s * 2 / v
        // }

        var _slowDown = function _slowDown() {
          var changeTime = Date.now() - startTime;

          if (!_this5.state.slowDownOverflow) {
            if (_this5.state.x >= _this5.state.minX) {
              _this5.stopScrolling();

              _this5.translateTo(_this5.state.minX);

              return;
            } else if (_this5.state.x <= _this5.state.maxX) {
              _this5.stopScrolling();

              _this5.translateTo(_this5.state.maxX);

              return;
            }
          }

          if (_this5.state.x >= minLimitX || _this5.state.x <= maxLimitX || changeTime >= time) {
            _this5.stopScrolling();

            _this5.bounce();

            return;
          }

          _this5.state.scrolling = true;

          _this5.setTimer(function () {
            // this.translateTo(startX + s * easeOut(changeTime/time))
            var tempV = v * (1 - quadratic(changeTime / time));

            _this5.translate(tempV * 16);

            _slowDown();
          });
        };

        _slowDown();
      }
    }, {
      key: "translateTo",
      value: function translateTo(x) {
        var triggerEvent = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
        // 滚动到x
        // console.log(x)
        this.state.x = x;

        if (this.state.useTransform) {
          this.$con.style.webkitTransform = "translateZ(0) translateX(".concat(x, "px)");
          this.$con.style.transform = "translateZ(0) translateX(".concat(x, "px)");
        } else {
          this.$con.style.marginTop = "".concat(x, "px");
        }

        triggerEvent && this.trigger("scroll", this.state);
      }
    }, {
      key: "translate",
      value: function translate() {
        var len = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
        // 滚动内容
        this.translateTo(this.state.x + len);
      }
    }, {
      key: "on",
      value: function on(name, callback) {
        var handles = this.eventHandles;

        if (!handles[name]) {
          handles[name] = [];
        }

        handles[name].push(callback);
      }
    }, {
      key: "trigger",
      value: function trigger(name, data) {
        var handles = this.eventHandles;
        if (!handles[name]) return;
        handles[name].forEach(function (h) {
          h(data);
        });
      }
    }, {
      key: "off",
      value: function off(name, callback) {
        var _this6 = this;

        var handles = this.eventHandles;

        if (!name) {
          Object.keys(handles).forEach(function (name) {
            _this6.off(name);
          });
        }

        if (!handles[name]) return;

        if (!callback) {
          handles[name] = [];
        } else {
          var index = handles[name].findIndex(function (h) {
            return h === callback;
          });
          handles[name].splice(index, 1);
        }
      }
    }, {
      key: "disable",
      value: function disable() {
        this.state.enabled = false;
      }
    }, {
      key: "enable",
      value: function enable() {
        this.state.enabled = true;
      }
    }, {
      key: "destroy",
      value: function destroy() {
        this.stopScrolling();
        this.off();

        this._removeEvent();

        this.translateTo(0);
      }
    }]);

    return XMScroll;
  }();

  XMScroll.defaults = {
    content: null,
    // 滚动内容的Node或选择器，不传默认取容器的第一个子节点
    useTransform: true,
    // 默认使用transform，false时，将使用marginTop
    slowDownOverflow: true
  };
  var _default = XMScroll;
  _exports["default"] = _default;
  module.exports = exports.default;
});