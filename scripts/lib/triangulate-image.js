(function(f) {
    if (typeof exports === 'object' && typeof module !== 'undefined') {
        module.exports = f();
    } else {
        if (typeof define === 'function' && define.amd) {
            define([], f);
        } else {
            var g;
            if (typeof window !== 'undefined') {
                g = window;
            } else {
                if (typeof global !== 'undefined') {
                    g = global;
                } else {
                    if (typeof self !== 'undefined') {
                        g = self;
                    } else {
                        g = this;
                    }
                }
            }
            g.triangulate = f();
        }
    }
})(function() {
    var define, module, exports;
    return function e(t, n, r) {
        function s(o, u) {
            if (!n[o]) {
                if (!t[o]) {
                    var a = typeof require == 'function' && require;
                    if (!u && a) {
                        return a(o, !0);
                    }
                    if (i) {
                        return i(o, !0);
                    }
                    var f = new Error('Cannot find module \'' + o + '\'');
                    throw f.code = 'MODULE_NOT_FOUND', f;
                }
                var l = n[o] = {
                    exports: {}
                };
                t[o][0].call(l.exports, function(e) {
                    var n = t[o][1][e];
                    return s(n ? n : e);
                }, l, l.exports, e, t, n, r);
            }
            return n[o].exports;
        }
        var i = typeof require == 'function' && require;
        for (var o = 0; o < r.length; o++) {
            s(r[o]);
        }
        return s;
    }({
        1: [ function(_dereq_, module, exports) {
            'use strict';
            function _interopRequireDefault(obj) {
                return obj && obj.__esModule ? obj : {
                    default: obj
                };
            }
            Object.defineProperty(exports, '__esModule', {
                value: !0
            });
            var _extends = Object.assign || function(target) {
                for (var i = 1; i < arguments.length; i++) {
                    var source = arguments[i];
                    for (var key in source) {
                        Object.prototype.hasOwnProperty.call(source, key) && (target[key] = source[key]);
                    }
                }
                return target;
            };
            exports.default = function(params) {
                function getParams() {
                    return params;
                }
                function getInput() {
                    var result = _extends({}, api);
                    return inputFn || _extends(result, inputMethods), result;
                }
                function getOutput() {
                    var result = _extends({}, api);
                    return outputFn || _extends(result, outputMethods), result;
                }
                function fromImage(inputParams) {
                    return setInput(_fromImageToImageData2.default, inputParams);
                }
                function fromImageSync(inputParams) {
                    return setInput(_fromImageToImageData2.default, inputParams, !0);
                }
                function fromImageData(inputParams) {
                    return setInput(function(id) {
                        return id;
                    }, inputParams);
                }
                function fromImageDataSync(inputParams) {
                    return setInput(function(id) {
                        return id;
                    }, inputParams, !0);
                }
                function toData(outputParams) {
                    return setOutput(function(p) {
                        return p;
                    }, outputParams);
                }
                function toDataSync(outputParams) {
                    return setOutput(function(p) {
                        return p;
                    }, outputParams, !0);
                }
                function toDataURL(outputParams) {
                    return setOutput(_polygonsToDataURL2.default, outputParams);
                }
                function toDataURLSync(outputParams) {
                    return setOutput(_polygonsToDataURL2.default, outputParams, !0);
                }
                function toImageData(outputParams) {
                    return setOutput(_polygonsToImageData2.default, outputParams);
                }
                function toImageDataSync(outputParams) {
                    return setOutput(_polygonsToImageData2.default, outputParams, !0);
                }
                function toSVG(outputParams) {
                    return setOutput(_polygonsToSVG2.default, outputParams);
                }
                function toSVGSync(outputParams) {
                    return setOutput(_polygonsToSVG2.default, outputParams, !0);
                }
                function setInput(fn, inputParams, isSync) {
                    return isInputSync = !!isSync, inputFn = function() {
                        return isInputSync ? fn(inputParams) : new Promise(function(resolve, reject) {
                            try {
                                var imageData = fn(inputParams);
                                resolve(imageData);
                            } catch (err) {
                                reject(err);
                            }
                        });
                    }, isReady() ? getResult() : getOutput();
                }
                function setOutput(fn, outputpParams, isSync) {
                    return isOutputSync = !!isSync, outputFn = function(polygons, size) {
                        return isOutputSync ? fn(polygons, size, outputpParams) : new Promise(function(resolve, reject) {
                            try {
                                var outputData = fn(polygons, size, outputpParams);
                                resolve(outputData);
                            } catch (err) {
                                reject(err);
                            }
                        });
                    }, isReady() ? getResult() : getInput();
                }
                function isReady() {
                    return inputFn && outputFn;
                }
                function getResult() {
                    if (isInputSync && isOutputSync) {
                        var imageData = inputFn(params), polygonData = (0, _imageDataToPolygons2.default)(imageData, params), outputData = outputFn(polygonData, imageData);
                        return outputData;
                    }
                    return new Promise(function(resolve, reject) {
                        var imageData;
                        makeInput().then(function(imgData) {
                            return imageData = imgData, makePolygonsInWorker(imageData, params);
                        }, reject).then(function(polygonData) {
                            return makeOutput(polygonData, imageData);
                        }, reject).then(function(outputData) {
                            resolve(outputData);
                        }, reject);
                    });
                }
                function makeInput(inputParams) {
                    return new Promise(function(resolve, reject) {
                        if (isInputSync) {
                            try {
                                var imageData = inputFn(inputParams);
                                resolve(imageData);
                            } catch (err) {
                                reject(err);
                            }
                        } else {
                            inputFn(inputParams).then(resolve, reject);
                        }
                    });
                }
                function makePolygonsInWorker(imageData, params) {
                    return new Promise(function(resolve, reject) {
                        worker.addEventListener('message', function(event) {
                            if (event.data && event.data.polygonJSONStr) {
                                var polygonData = JSON.parse(event.data.polygonJSONStr);
                                resolve(polygonData);
                            } else {
                                reject(event.data && event.data.err ? event.data.err : event);
                            }
                        }), worker.postMessage({
                            params: params,
                            imageData: imageData,
                            imageDataWidth: imageData.width,
                            imageDataHeight: imageData.height
                        });
                    });
                }
                function makeOutput(polygonData, imageData) {
                    return new Promise(function(resolve, reject) {
                        if (isOutputSync) {
                            try {
                                var outputData = outputFn(polygonData, imageData);
                                resolve(outputData);
                            } catch (e) {
                                reject(e);
                            }
                        } else {
                            outputFn(polygonData, imageData).then(resolve, reject);
                        }
                    });
                }
                params = (0, _sanitizeInput2.default)(params);
                var isInputSync = !1, isOutputSync = !1, worker = (0, _webworkify2.default)(_triangulationWorker2.default), inputFn = void 0, outputFn = void 0, api = {
                    getParams: getParams,
                    getInput: getInput,
                    getOutput: getOutput
                }, inputMethods = {
                    fromImage: fromImage,
                    fromImageSync: fromImageSync,
                    fromImageData: fromImageData,
                    fromImageDataSync: fromImageDataSync
                }, outputMethods = {
                    toData: toData,
                    toDataSync: toDataSync,
                    toDataURL: toDataURL,
                    toDataURLSync: toDataURLSync,
                    toImageData: toImageData,
                    toImageDataSync: toImageDataSync,
                    toSVG: toSVG,
                    toSVGSync: toSVGSync
                };
                return getInput();
            };
            var _sanitizeInput = _dereq_('./input/sanitizeInput'), _sanitizeInput2 = _interopRequireDefault(_sanitizeInput), _fromImageToImageData = _dereq_('./input/browser/fromImageToImageData'), _fromImageToImageData2 = _interopRequireDefault(_fromImageToImageData), _polygonsToImageData = _dereq_('./output/polygonsToImageData'), _polygonsToImageData2 = _interopRequireDefault(_polygonsToImageData), _polygonsToDataURL = _dereq_('./output/polygonsToDataURL'), _polygonsToDataURL2 = _interopRequireDefault(_polygonsToDataURL), _polygonsToSVG = _dereq_('./output/polygonsToSVG'), _polygonsToSVG2 = _interopRequireDefault(_polygonsToSVG), _imageDataToPolygons = _dereq_('./polygons/imageDataToPolygons'), _imageDataToPolygons2 = _interopRequireDefault(_imageDataToPolygons), _webworkify = _dereq_('webworkify'), _webworkify2 = _interopRequireDefault(_webworkify), _triangulationWorker = _dereq_('./workers/triangulationWorker'), _triangulationWorker2 = _interopRequireDefault(_triangulationWorker);
            module.exports = exports.default;
        }, {
            './input/browser/fromImageToImageData': 4,
            './input/sanitizeInput': 6,
            './output/polygonsToDataURL': 7,
            './output/polygonsToImageData': 8,
            './output/polygonsToSVG': 9,
            './polygons/imageDataToPolygons': 16,
            './workers/triangulationWorker': 30,
            webworkify: 35
        } ],
        2: [ function(_dereq_, module, exports) {
            'use strict';
            function _interopRequireDefault(obj) {
                return obj && obj.__esModule ? obj : {
                    default: obj
                };
            }
            function copyImageDataWithCanvas(imageData) {
                var canvas = (0, _canvasBrowserify2.default)(imageData.width, imageData.height), ctx = canvas.getContext('2d');
                return ctx.putImageData(imageData, 0, 0), ctx.getImageData(0, 0, imageData.width, imageData.height);
            }
            Object.defineProperty(exports, '__esModule', {
                value: !0
            }), exports.default = function(imageData) {
                if ((0, _isImageData2.default)(imageData)) {
                    if ('undefined' == typeof Uint8ClampedArray) {
                        if ('undefined' == typeof window) {
                            throw new Error('Can\'t copy imageData in webworker without Uint8ClampedArray support.');
                        }
                        return copyImageDataWithCanvas(imageData);
                    }
                    var clampedArray = new Uint8ClampedArray(imageData.data);
                    if ('undefined' == typeof ImageData) {
                        return {
                            width: imageData.width,
                            height: imageData.height,
                            data: clampedArray
                        };
                    }
                    var result = void 0;
                    try {
                        result = new ImageData(clampedArray, imageData.width, imageData.height);
                    } catch (err) {
                        if ('undefined' == typeof window) {
                            throw new Error('Can\'t copy imageData in webworker without proper ImageData() support.');
                        }
                        result = copyImageDataWithCanvas(imageData);
                    }
                    return result;
                }
                throw new Error('Given imageData object is not useable.');
            };
            var _canvasBrowserify = _dereq_('canvas-browserify'), _canvasBrowserify2 = _interopRequireDefault(_canvasBrowserify), _isImageData = _dereq_('../util/isImageData'), _isImageData2 = _interopRequireDefault(_isImageData);
            module.exports = exports.default;
        }, {
            '../util/isImageData': 23,
            'canvas-browserify': 31
        } ],
        3: [ function(_dereq_, module, exports) {
            'use strict';
            Object.defineProperty(exports, '__esModule', {
                value: !0
            }), exports.default = function(imageData) {
                for (var len = imageData.data.length, brightness = void 0, i = 0; i < len; i += 4) {
                    brightness = .34 * imageData.data[i] + .5 * imageData.data[i + 1] + .16 * imageData.data[i + 2], 
                    imageData.data[i] = brightness, imageData.data[i + 1] = brightness, imageData.data[i + 2] = brightness;
                }
                return imageData;
            }, module.exports = exports.default;
        }, {} ],
        4: [ function(_dereq_, module, exports) {
            'use strict';
            function _interopRequireDefault(obj) {
                return obj && obj.__esModule ? obj : {
                    default: obj
                };
            }
            Object.defineProperty(exports, '__esModule', {
                value: !0
            }), exports.default = function(image) {
                if (image instanceof HTMLImageElement) {
                    if (!image.naturalWidth || !image.naturalHeight || image.complete === !1) {
                        throw new Error('This this image hasn\'t finished loading: ' + image.src);
                    }
                    var canvas = new _canvasBrowserify2.default(image.naturalWidth, image.naturalHeight), ctx = canvas.getContext('2d');
                    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
                    var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    return imageData.data && imageData.data.length && ('undefined' == typeof imageData.width && (imageData.width = image.naturalWidth), 
                    'undefined' == typeof imageData.height && (imageData.height = image.naturalHeight)), 
                    imageData;
                }
                throw new Error('This object does not seem to be an image.');
            };
            var _canvasBrowserify = _dereq_('canvas-browserify'), _canvasBrowserify2 = _interopRequireDefault(_canvasBrowserify), Image = _canvasBrowserify2.default.Image;
            module.exports = exports.default;
        }, {
            'canvas-browserify': 31
        } ],
        5: [ function(_dereq_, module, exports) {
            'use strict';
            Object.defineProperty(exports, '__esModule', {
                value: !0
            }), exports.default = {
                accuracy: .7,
                blur: 4,
                fill: !0,
                stroke: !0,
                strokeWidth: .5,
                lineJoin: 'miter',
                vertexCount: 700,
                threshold: 50,
                transparentColor: !1
            }, module.exports = exports.default;
        }, {} ],
        6: [ function(_dereq_, module, exports) {
            'use strict';
            function _interopRequireDefault(obj) {
                return obj && obj.__esModule ? obj : {
                    default: obj
                };
            }
            Object.defineProperty(exports, '__esModule', {
                value: !0
            });
            var _typeof = 'function' == typeof Symbol && 'symbol' == typeof Symbol.iterator ? function(obj) {
                return typeof obj;
            } : function(obj) {
                return obj && 'function' == typeof Symbol && obj.constructor === Symbol ? 'symbol' : typeof obj;
            };
            exports.default = function(params) {
                return params = (0, _clone2.default)(params), 'object' !== ('undefined' == typeof params ? 'undefined' : _typeof(params)) && (params = {}), 
                'number' != typeof params.accuracy || isNaN(params.accuracy) ? params.accuracy = _defaultParams2.default.accuracy : params.accuracy = (0, 
                _clamp2.default)(params.accuracy, 0, 1), ('number' != typeof params.blur || isNaN(params.blur)) && (params.blur = _defaultParams2.default.blur), 
                params.blur <= 0 && (params.blur = 1), 'string' != typeof params.fill && 'boolean' != typeof params.fill && (params.fill = _defaultParams2.default.fill), 
                'string' != typeof params.stroke && 'boolean' != typeof params.stroke && (params.stroke = _defaultParams2.default.stroke), 
                ('number' != typeof params.strokeWidth || isNaN(params.strokeWidth)) && (params.strokeWidth = _defaultParams2.default.strokeWidth), 
                'number' != typeof params.threshold || isNaN(params.threshold) ? params.threshold = _defaultParams2.default.threshold : params.threshold = (0, 
                _clamp2.default)(params.threshold, 1, 100), 'string' == typeof params.lineJoin && allowedLineJoins.indexOf(params.lineJoin) !== -1 || (params.lineJoin = _defaultParams2.default.lineJoin), 
                params.gradients && params.fill ? params.gradients = !0 : params.gradients = !1, 
                params.gradients && (('number' != typeof params.gradientStops || isNaN(params.gradientStops) || params.gradientStops < 2) && (params.gradientStops = 2), 
                params.gradientStops = Math.round(params.gradientStops)), ('number' != typeof params.vertexCount || isNaN(params.vertexCount)) && (params.vertexCount = _defaultParams2.default.vertexCount), 
                params.vertexCount <= 0 && (params.vertexCount = 1), 'string' != typeof params.transparentColor && 'boolean' != typeof params.transparentColor && (params.transparentColor = _defaultParams2.default.transparentColor), 
                typeof params.transparentColor === !0 && (params.transparentColor = !1), 'string' == typeof params.transparentColor && (params.transparentColor = (0, 
                _toColor2.default)(params.transparentColor)), params;
            };
            var _clamp = _dereq_('../util/clamp'), _clamp2 = _interopRequireDefault(_clamp), _clone = _dereq_('../util/clone'), _clone2 = _interopRequireDefault(_clone), _toColor = _dereq_('../util/toColor'), _toColor2 = _interopRequireDefault(_toColor), _defaultParams = _dereq_('./defaultParams'), _defaultParams2 = _interopRequireDefault(_defaultParams), allowedLineJoins = [ 'miter', 'round', 'bevel' ];
            module.exports = exports.default;
        }, {
            '../util/clamp': 17,
            '../util/clone': 18,
            '../util/toColor': 28,
            './defaultParams': 5
        } ],
        7: [ function(_dereq_, module, exports) {
            'use strict';
            function _interopRequireDefault(obj) {
                return obj && obj.__esModule ? obj : {
                    default: obj
                };
            }
            Object.defineProperty(exports, '__esModule', {
                value: !0
            }), exports.default = function(polygons, size, options) {
                var dpr = options && options.dpr ? options.dpr : 1, canvasData = (0, _makeCanvasAndContext2.default)(size, options, dpr);
                return (0, _drawPolygonsOnContext2.default)(canvasData.ctx, polygons, size, dpr), 
                canvasData.canvas.toDataURL();
            };
            var _makeCanvasAndContext = _dereq_('../util/makeCanvasAndContext'), _makeCanvasAndContext2 = _interopRequireDefault(_makeCanvasAndContext), _drawPolygonsOnContext = _dereq_('../util/drawPolygonsOnContext'), _drawPolygonsOnContext2 = _interopRequireDefault(_drawPolygonsOnContext);
            module.exports = exports.default;
        }, {
            '../util/drawPolygonsOnContext': 20,
            '../util/makeCanvasAndContext': 26
        } ],
        8: [ function(_dereq_, module, exports) {
            'use strict';
            function _interopRequireDefault(obj) {
                return obj && obj.__esModule ? obj : {
                    default: obj
                };
            }
            Object.defineProperty(exports, '__esModule', {
                value: !0
            }), exports.default = function(polygons, size, options) {
                var dpr = options && options.dpr ? options.dpr : 1, ctx = (0, _makeCanvasAndContext2.default)(size, options, dpr, !0).ctx;
                return (0, _drawPolygonsOnContext2.default)(ctx, polygons, size, dpr), ctx.getImageData(0, 0, size.width * dpr, size.height * dpr);
            };
            var _makeCanvasAndContext = _dereq_('../util/makeCanvasAndContext'), _makeCanvasAndContext2 = _interopRequireDefault(_makeCanvasAndContext), _drawPolygonsOnContext = _dereq_('../util/drawPolygonsOnContext'), _drawPolygonsOnContext2 = _interopRequireDefault(_drawPolygonsOnContext);
            module.exports = exports.default;
        }, {
            '../util/drawPolygonsOnContext': 20,
            '../util/makeCanvasAndContext': 26
        } ],
        9: [ function(_dereq_, module, exports) {
            'use strict';
            function _interopRequireDefault(obj) {
                return obj && obj.__esModule ? obj : {
                    default: obj
                };
            }
            Object.defineProperty(exports, '__esModule', {
                value: !0
            }), exports.default = function(polygons, size) {
                var defStr = '';
                polygons.length && polygons[0].gradient && (defStr = '<defs>');
                var polygonStr = '';
                polygons.forEach(function(polygon, index) {
                    var a = polygon.a, b = polygon.b, c = polygon.c;
                    polygonStr += '<polygon points="' + a.x + ',' + a.y + ' ' + b.x + ',' + b.y + ' ' + c.x + ',' + c.y + '"', 
                    polygon.gradient ? !function() {
                        var bb = polygon.boundingBox, x1 = ((polygon.gradient.x1 - bb.x) / bb.width * 100).toFixed(3), y1 = ((polygon.gradient.y1 - bb.y) / bb.height * 100).toFixed(3), x2 = ((polygon.gradient.x2 - bb.x) / bb.width * 100).toFixed(3), y2 = ((polygon.gradient.y2 - bb.y) / bb.height * 100).toFixed(3);
                        defStr += '\n\t<linearGradient id="gradient-' + index + '" x1="' + x1 + '%" y1="' + y1 + '%" x2="' + x2 + '%" y2="' + y2 + '%">';
                        var lastColorIndex = polygon.gradient.colors.length - 1;
                        polygon.gradient.colors.forEach(function(color, index) {
                            var rgb = (0, _toRGBA2.default)(color), offset = (index / lastColorIndex * 100).toFixed(3);
                            defStr += '\n\t\t\t\t\t<stop offset="' + offset + '%" stop-color="' + rgb + '"/>\n\t\t\t\t';
                        }), defStr += '</linearGradient>', polygonStr += ' fill="url(#gradient-' + index + ')"', 
                        polygon.strokeWidth > 0 && (polygonStr += ' stroke="url(#gradient-' + index + ')" stroke-width="' + polygon.strokeWidth + '" stroke-linejoin="' + polygon.lineJoin + '"');
                    }() : (polygonStr += polygon.fill ? ' fill="' + polygon.fill + '"' : ' fill="transparent"', 
                    polygon.strokeColor && (polygonStr += ' stroke="' + polygon.strokeColor + '" stroke-width="' + polygon.strokeWidth + '" stroke-linejoin="' + polygon.lineJoin + '"')), 
                    polygonStr += '/>\n\t';
                }), defStr.length && (defStr += '\n\t\t</defs>');
                var svg = '<?xml version="1.0" standalone="yes"?>\n<svg width="' + size.width + '" height="' + size.height + '" xmlns="http://www.w3.org/2000/svg" version="1.1" >\n\t' + defStr + '\n\t' + polygonStr + '\n</svg>';
                return svg;
            };
            var _toRGBA = _dereq_('../util/toRGBA'), _toRGBA2 = _interopRequireDefault(_toRGBA);
            module.exports = exports.default;
        }, {
            '../util/toRGBA': 29
        } ],
        10: [ function(_dereq_, module, exports) {
            'use strict';
            function _interopRequireDefault(obj) {
                return obj && obj.__esModule ? obj : {
                    default: obj
                };
            }
            Object.defineProperty(exports, '__esModule', {
                value: !0
            }), exports.default = function(polygons, colorData, params) {
                return polygons.forEach(function(polygon) {
                    polygon.boundingBox = (0, _getBoundingBox2.default)([ polygon.a, polygon.b, polygon.c ]);
                }), polygons.filter(function(polygon) {
                    return polygon.boundingBox.width > 0 && polygon.boundingBox.height > 0;
                });
            };
            var _getBoundingBox = _dereq_('../util/getBoundingBox'), _getBoundingBox2 = _interopRequireDefault(_getBoundingBox);
            module.exports = exports.default;
        }, {
            '../util/getBoundingBox': 21
        } ],
        11: [ function(_dereq_, module, exports) {
            'use strict';
            function _interopRequireDefault(obj) {
                return obj && obj.__esModule ? obj : {
                    default: obj
                };
            }
            Object.defineProperty(exports, '__esModule', {
                value: !0
            }), exports.default = function(polygons, colorData, params) {
                var fill = params.fill, stroke = params.stroke, strokeWidth = params.strokeWidth, lineJoin = params.lineJoin, transparentColor = params.transparentColor, fillColor = 'string' == typeof fill && fill, strokeColor = 'string' == typeof stroke && stroke, getColor = function(color, override) {
                    var t = (0, _isTransparent2.default)(color) && transparentColor, c = t ? transparentColor : color;
                    return override && !t ? override : (0, _toRGBA2.default)(c);
                };
                return polygons.forEach(function(polygon, index) {
                    var color = (0, _getColorByPos2.default)((0, _polygonCenter2.default)(polygon), colorData);
                    fill && (polygon.fill = getColor(color, fillColor)), stroke && (polygon.strokeColor = getColor(color, strokeColor), 
                    polygon.strokeWidth = strokeWidth, polygon.lineJoin = lineJoin);
                }), polygons;
            };
            var _getColorByPos = _dereq_('../util/getColorByPos'), _getColorByPos2 = _interopRequireDefault(_getColorByPos), _polygonCenter = _dereq_('../util/polygonCenter'), _polygonCenter2 = _interopRequireDefault(_polygonCenter), _isTransparent = _dereq_('../util/isTransparent'), _isTransparent2 = _interopRequireDefault(_isTransparent), _toRGBA = _dereq_('../util/toRGBA'), _toRGBA2 = _interopRequireDefault(_toRGBA);
            module.exports = exports.default;
        }, {
            '../util/getColorByPos': 22,
            '../util/isTransparent': 24,
            '../util/polygonCenter': 27,
            '../util/toRGBA': 29
        } ],
        12: [ function(_dereq_, module, exports) {
            'use strict';
            function _interopRequireDefault(obj) {
                return obj && obj.__esModule ? obj : {
                    default: obj
                };
            }
            Object.defineProperty(exports, '__esModule', {
                value: !0
            }), exports.default = function(polygons, colorData, params) {
                return polygons.forEach(function(polygon, polygonIndex) {
                    var data = {};
                    'abc'.split('').forEach(function(key) {
                        var color = (0, _getColorByPos2.default)(polygon[key], colorData, params.transparentColor);
                        data[key] = {
                            key: key,
                            color: color,
                            x: polygon[key].x,
                            y: polygon[key].y
                        }, data[key].luminance = (0, _luminance2.default)(data[key].color);
                        var otherKeys = 'abc'.replace(key, '').split('');
                        data[key].median = {
                            x: (polygon[otherKeys[0]].x + polygon[otherKeys[1]].x) / 2,
                            y: (polygon[otherKeys[0]].y + polygon[otherKeys[1]].y) / 2
                        }, data[key].medianColor = (0, _getColorByPos2.default)(data[key].median, colorData, params.transparentColor), 
                        data[key].medianLuminance = (0, _luminance2.default)(data[key].medianColor);
                    });
                    for (var pointsByDeltaInLuminance = [ data.a, data.b, data.c ].sort(function(u, v) {
                        return Math.abs(u.luminance - u.medianLuminance) - Math.abs(v.luminance - v.medianLuminance);
                    }), pointWithMostDeltaInLuminance = pointsByDeltaInLuminance[0], startPoint = pointsByDeltaInLuminance[0], endPoint = pointWithMostDeltaInLuminance.median, gradienStopPositions = [ startPoint ], startToEndDistance = (0, 
                    _distance2.default)(startPoint, endPoint), i = 1, len = params.gradientStops - 2; i < len; i++) {
                        var pointDistance = i * (startToEndDistance / params.gradientStops), pointPercent = pointDistance / startToEndDistance, point = {
                            x: startPoint.x + pointPercent * (endPoint.x - startPoint.x),
                            y: startPoint.y + pointPercent * (endPoint.y - startPoint.y)
                        };
                        gradienStopPositions.push(point);
                    }
                    gradienStopPositions.push(endPoint), polygon.gradient = {
                        x1: pointWithMostDeltaInLuminance.x,
                        y1: pointWithMostDeltaInLuminance.y,
                        x2: pointWithMostDeltaInLuminance.median.x,
                        y2: pointWithMostDeltaInLuminance.median.y,
                        colors: gradienStopPositions.map(function(pos) {
                            return (0, _getColorByPos2.default)(pos, colorData, params.transparentColor);
                        })
                    }, params.stroke && (polygon.strokeWidth = params.strokeWidth, polygon.lineJoin = params.lineJoin), 
                    data = null;
                }), polygons;
            };
            var _luminance = _dereq_('../util/luminance'), _luminance2 = _interopRequireDefault(_luminance), _distance = _dereq_('../util/distance'), _distance2 = _interopRequireDefault(_distance), _getColorByPos = _dereq_('../util/getColorByPos'), _getColorByPos2 = _interopRequireDefault(_getColorByPos);
            module.exports = exports.default;
        }, {
            '../util/distance': 19,
            '../util/getColorByPos': 22,
            '../util/luminance': 25
        } ],
        13: [ function(_dereq_, module, exports) {
            'use strict';
            function _interopRequireDefault(obj) {
                return obj && obj.__esModule ? obj : {
                    default: obj
                };
            }
            Object.defineProperty(exports, '__esModule', {
                value: !0
            }), exports.default = function(polygons, colorData) {
                return polygons.filter(function(polygon) {
                    var color = (0, _getColorByPos2.default)((0, _polygonCenter2.default)(polygon), colorData);
                    return !(0, _isTransparent2.default)(color);
                });
            };
            var _getColorByPos = _dereq_('../util/getColorByPos'), _getColorByPos2 = _interopRequireDefault(_getColorByPos), _polygonCenter = _dereq_('../util/polygonCenter'), _polygonCenter2 = _interopRequireDefault(_polygonCenter), _isTransparent = _dereq_('../util/isTransparent'), _isTransparent2 = _interopRequireDefault(_isTransparent);
            module.exports = exports.default;
        }, {
            '../util/getColorByPos': 22,
            '../util/isTransparent': 24,
            '../util/polygonCenter': 27
        } ],
        14: [ function(_dereq_, module, exports) {
            'use strict';
            Object.defineProperty(exports, '__esModule', {
                value: !0
            }), exports.default = function(imageData, threshold) {
                var x, y, row, col, sx, sy, step, sum, total, multiplier = 2, width = imageData.width, height = imageData.height, data = imageData.data, points = [];
                for (y = 0; y < height; y += multiplier) {
                    for (x = 0; x < width; x += multiplier) {
                        for (sum = total = 0, row = -1; row <= 1; row++) {
                            if (sy = y + row, step = sy * width, sy >= 0 && sy < height) {
                                for (col = -1; col <= 1; col++) {
                                    sx = x + col, sx >= 0 && sx < width && (sum += data[sx + step << 2], total++);
                                }
                            }
                        }
                        total && (sum /= total), sum > threshold && points.push({
                            x: x,
                            y: y
                        });
                    }
                }
                return points;
            }, module.exports = exports.default;
        }, {} ],
        15: [ function(_dereq_, module, exports) {
            'use strict';
            function _interopRequireDefault(obj) {
                return obj && obj.__esModule ? obj : {
                    default: obj
                };
            }
            function addVertex(x, y, hash) {
                var resultKey = x + '|' + y;
                hash[resultKey] || (hash[resultKey] = {
                    x: x,
                    y: y
                }), resultKey = null;
            }
            Object.defineProperty(exports, '__esModule', {
                value: !0
            }), exports.default = function(points, maxPointCount, accuracy, width, height) {
                var resultHash = {}, gridPointCount = Math.max(~~(maxPointCount * (1 - accuracy)), 5), gridColumns = Math.round(Math.sqrt(gridPointCount)), gridRows = Math.round(Math.ceil(gridPointCount / gridColumns)), xIncrement = ~~(width / gridColumns), yIncrement = ~~(height / gridRows), rowIndex = 0, startX = 0, x = 0, y = 0;
                for (y = 0; y < height; y += yIncrement) {
                    for (rowIndex++, startX = rowIndex % 2 === 0 ? ~~(xIncrement / 2) : 0, x = startX; x < width; x += xIncrement) {
                        x < width && y < height && addVertex(~~(x + Math.cos(y) * yIncrement), ~~(y + Math.sin(x) * xIncrement), resultHash);
                    }
                }
                addVertex(0, 0, resultHash), addVertex(width - 1, 0, resultHash), addVertex(width - 1, height - 1, resultHash), 
                addVertex(0, height - 1, resultHash);
                var remainingPointCount = maxPointCount - Object.keys(resultHash).length, edgePointCount = points.length, increment = ~~(edgePointCount / remainingPointCount);
                if (maxPointCount > 0 && increment > 0) {
                    var i = 0;
                    for (i = 0; i < edgePointCount; i += increment) {
                        addVertex(points[i].x, points[i].y, resultHash);
                    }
                }
                return points = null, Object.keys(resultHash).map(function(key) {
                    return resultHash[key];
                });
            };
            var _clamp = _dereq_('../util/clamp'), _clamp2 = _interopRequireDefault(_clamp);
            module.exports = exports.default;
        }, {
            '../util/clamp': 17
        } ],
        16: [ function(_dereq_, module, exports) {
            'use strict';
            function _interopRequireDefault(obj) {
                return obj && obj.__esModule ? obj : {
                    default: obj
                };
            }
            Object.defineProperty(exports, '__esModule', {
                value: !0
            }), exports.default = function(imageData, params) {
                if ((0, _isImageData2.default)(imageData)) {
                    var imageSize = {
                        width: imageData.width,
                        height: imageData.height
                    }, tmpImageData = (0, _copyImageData2.default)(imageData), colorImageData = (0, 
                    _copyImageData2.default)(imageData), blurredImageData = (0, _stackblurCanvas.imageDataRGBA)(tmpImageData, 0, 0, imageSize.width, imageSize.height, params.blur), greyscaleImageData = (0, 
                    _greyscale2.default)(blurredImageData), edgesImageData = (0, _sobel2.default)(greyscaleImageData).toImageData(), edgePoints = (0, 
                    _getEdgePoints2.default)(edgesImageData, params.threshold), edgeVertices = (0, _getVerticesFromPoints2.default)(edgePoints, params.vertexCount, params.accuracy, imageSize.width, imageSize.height), polygons = (0, 
                    _delaunayFast.triangulate)(edgeVertices);
                    return polygons = (0, _addBoundingBoxesToPolygons2.default)(polygons), params.transparentColor || (polygons = (0, 
                    _filterTransparentPolygons2.default)(polygons, colorImageData)), polygons = params.fill === !0 && params.gradients === !0 ? (0, 
                    _addGradientsToPolygons2.default)(polygons, colorImageData, params) : (0, _addColorToPolygons2.default)(polygons, colorImageData, params);
                }
                throw new Error('Can\'t work with the imageData provided. It seems to be corrupt.');
            };
            var _stackblurCanvas = _dereq_('stackblur-canvas'), _delaunayFast = _dereq_('delaunay-fast'), _sobel = _dereq_('sobel'), _sobel2 = _interopRequireDefault(_sobel), _isImageData = _dereq_('../util/isImageData'), _isImageData2 = _interopRequireDefault(_isImageData), _copyImageData = _dereq_('../imagedata/copyImageData'), _copyImageData2 = _interopRequireDefault(_copyImageData), _greyscale = _dereq_('../imagedata/greyscale'), _greyscale2 = _interopRequireDefault(_greyscale), _getEdgePoints = _dereq_('./getEdgePoints'), _getEdgePoints2 = _interopRequireDefault(_getEdgePoints), _getVerticesFromPoints = _dereq_('./getVerticesFromPoints'), _getVerticesFromPoints2 = _interopRequireDefault(_getVerticesFromPoints), _addBoundingBoxesToPolygons = _dereq_('./addBoundingBoxesToPolygons'), _addBoundingBoxesToPolygons2 = _interopRequireDefault(_addBoundingBoxesToPolygons), _addColorToPolygons = _dereq_('./addColorToPolygons'), _addColorToPolygons2 = _interopRequireDefault(_addColorToPolygons), _addGradientsToPolygons = _dereq_('./addGradientsToPolygons'), _addGradientsToPolygons2 = _interopRequireDefault(_addGradientsToPolygons), _filterTransparentPolygons = _dereq_('./filterTransparentPolygons'), _filterTransparentPolygons2 = _interopRequireDefault(_filterTransparentPolygons);
            module.exports = exports.default;
        }, {
            '../imagedata/copyImageData': 2,
            '../imagedata/greyscale': 3,
            '../util/isImageData': 23,
            './addBoundingBoxesToPolygons': 10,
            './addColorToPolygons': 11,
            './addGradientsToPolygons': 12,
            './filterTransparentPolygons': 13,
            './getEdgePoints': 14,
            './getVerticesFromPoints': 15,
            'delaunay-fast': 32,
            sobel: 33,
            'stackblur-canvas': 34
        } ],
        17: [ function(_dereq_, module, exports) {
            'use strict';
            Object.defineProperty(exports, '__esModule', {
                value: !0
            }), exports.default = function(value, min, max) {
                return value < min ? min : value > max ? max : value;
            }, module.exports = exports.default;
        }, {} ],
        18: [ function(_dereq_, module, exports) {
            'use strict';
            Object.defineProperty(exports, '__esModule', {
                value: !0
            }), exports.default = function(obj) {
                var result = !1;
                if ('undefined' != typeof obj) {
                    try {
                        result = JSON.parse(JSON.stringify(obj));
                    } catch (e) {}
                }
                return result;
            }, module.exports = exports.default;
        }, {} ],
        19: [ function(_dereq_, module, exports) {
            'use strict';
            Object.defineProperty(exports, '__esModule', {
                value: !0
            }), exports.default = function(a, b) {
                var dx = b.x - a.x, dy = b.y - a.y;
                return Math.sqrt(dx * dx + dy * dy);
            }, module.exports = exports.default;
        }, {} ],
        20: [ function(_dereq_, module, exports) {
            'use strict';
            function _interopRequireDefault(obj) {
                return obj && obj.__esModule ? obj : {
                    default: obj
                };
            }
            Object.defineProperty(exports, '__esModule', {
                value: !0
            }), exports.default = function(ctx, polygons, size, dpr) {
                return dpr = dpr || 1, polygons.forEach(function(polygon, index) {
                    ctx.beginPath(), ctx.moveTo(polygon.a.x * dpr, polygon.a.y * dpr), ctx.lineTo(polygon.b.x * dpr, polygon.b.y * dpr), 
                    ctx.lineTo(polygon.c.x * dpr, polygon.c.y * dpr), ctx.lineTo(polygon.a.x * dpr, polygon.a.y * dpr), 
                    polygon.gradient ? !function() {
                        var gradient = ctx.createLinearGradient(polygon.gradient.x1 * dpr, polygon.gradient.y1 * dpr, polygon.gradient.x2 * dpr, polygon.gradient.y2 * dpr), lastColorIndex = polygon.gradient.colors.length - 1;
                        polygon.gradient.colors.forEach(function(color, index) {
                            var rgb = (0, _toRGBA2.default)(color);
                            gradient.addColorStop(index / lastColorIndex, rgb);
                        }), ctx.fillStyle = gradient, ctx.fill(), polygon.strokeWidth > 0 && (ctx.strokeStyle = gradient, 
                        ctx.lineWidth = polygon.strokeWidth * dpr, ctx.lineJoin = polygon.lineJoin, ctx.stroke());
                    }() : (polygon.fill && (ctx.fillStyle = polygon.fill, ctx.fill()), polygon.strokeColor && (ctx.strokeStyle = polygon.strokeColor, 
                    ctx.lineWidth = polygon.strokeWidth * dpr, ctx.lineJoin = polygon.lineJoin, ctx.stroke())), 
                    ctx.closePath();
                }), ctx;
            };
            var _toRGBA = _dereq_('./toRGBA'), _toRGBA2 = _interopRequireDefault(_toRGBA);
            module.exports = exports.default;
        }, {
            './toRGBA': 29
        } ],
        21: [ function(_dereq_, module, exports) {
            'use strict';
            Object.defineProperty(exports, '__esModule', {
                value: !0
            }), exports.default = function(points) {
                var xMin = 1 / 0, xMax = -(1 / 0), yMin = 1 / 0, yMax = -(1 / 0);
                return points.forEach(function(p) {
                    p.x < xMin && (xMin = p.x), p.y < yMin && (yMin = p.y), p.x > xMax && (xMax = p.x), 
                    p.y > yMax && (yMax = p.y);
                }), {
                    x: xMin,
                    y: yMin,
                    width: xMax - xMin,
                    height: yMax - yMin
                };
            }, module.exports = exports.default;
        }, {} ],
        22: [ function(_dereq_, module, exports) {
            'use strict';
            function _interopRequireDefault(obj) {
                return obj && obj.__esModule ? obj : {
                    default: obj
                };
            }
            function getColorByPos(pos, colorData, transparentColor) {
                var x = (0, _clamp2.default)(pos.x, 1, colorData.width - 2), y = (0, _clamp2.default)(pos.y, 1, colorData.height - 2), index = (0 | x) + (0 | y) * colorData.width << 2;
                index >= colorData.data.length && (index = colorData.data.length - 5);
                var alpha = colorData.data[index + 3] / 255;
                return transparentColor && 0 === alpha ? transparentColor : {
                    r: colorData.data[index],
                    g: colorData.data[index + 1],
                    b: colorData.data[index + 2],
                    a: alpha
                };
            }
            Object.defineProperty(exports, '__esModule', {
                value: !0
            }), exports.default = getColorByPos;
            var _clamp = _dereq_('./clamp'), _clamp2 = _interopRequireDefault(_clamp);
            module.exports = exports.default;
        }, {
            './clamp': 17
        } ],
        23: [ function(_dereq_, module, exports) {
            'use strict';
            Object.defineProperty(exports, '__esModule', {
                value: !0
            });
            var _typeof = 'function' == typeof Symbol && 'symbol' == typeof Symbol.iterator ? function(obj) {
                return typeof obj;
            } : function(obj) {
                return obj && 'function' == typeof Symbol && obj.constructor === Symbol ? 'symbol' : typeof obj;
            };
            exports.default = function(imageData) {
                return imageData && 'number' == typeof imageData.width && 'number' == typeof imageData.height && imageData.data && 'number' == typeof imageData.data.length && 'object' === _typeof(imageData.data);
            }, module.exports = exports.default;
        }, {} ],
        24: [ function(_dereq_, module, exports) {
            'use strict';
            Object.defineProperty(exports, '__esModule', {
                value: !0
            }), exports.default = function(color) {
                return 0 === color.a;
            }, module.exports = exports.default;
        }, {} ],
        25: [ function(_dereq_, module, exports) {
            'use strict';
            Object.defineProperty(exports, '__esModule', {
                value: !0
            }), exports.default = function(color) {
                var a = [ color.r, color.g, color.b ].map(function(v) {
                    return v /= 255, v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4);
                });
                return .2126 * a[0] + .7152 * a[1] + .0722 * a[2];
            }, module.exports = exports.default;
        }, {} ],
        26: [ function(_dereq_, module, exports) {
            'use strict';
            function _interopRequireDefault(obj) {
                return obj && obj.__esModule ? obj : {
                    default: obj
                };
            }
            Object.defineProperty(exports, '__esModule', {
                value: !0
            }), exports.default = function(size, options, dpr, format) {
                var backgroundColor = !(!options || !options.backgroundColor) && options.backgroundColor, canvas = new _canvasBrowserify2.default(size.width * dpr, size.height * dpr, format), ctx = canvas.getContext('2d');
                return backgroundColor && (ctx.fillStyle = backgroundColor, ctx.fillRect(0, 0, size.width * dpr, size.height * dpr), 
                ctx.fillStyle = 'transparent'), {
                    canvas: canvas,
                    ctx: ctx
                };
            };
            var _canvasBrowserify = _dereq_('canvas-browserify'), _canvasBrowserify2 = _interopRequireDefault(_canvasBrowserify);
            module.exports = exports.default;
        }, {
            'canvas-browserify': 31
        } ],
        27: [ function(_dereq_, module, exports) {
            'use strict';
            Object.defineProperty(exports, '__esModule', {
                value: !0
            }), exports.default = function(polygon) {
                return {
                    x: .33333 * (polygon.a.x + polygon.b.x + polygon.c.x),
                    y: .33333 * (polygon.a.y + polygon.b.y + polygon.c.y)
                };
            }, module.exports = exports.default;
        }, {} ],
        28: [ function(_dereq_, module, exports) {
            'use strict';
            function _interopRequireDefault(obj) {
                return obj && obj.__esModule ? obj : {
                    default: obj
                };
            }
            Object.defineProperty(exports, '__esModule', {
                value: !0
            }), exports.default = function(color) {
                var size = 1, ctx = (0, _makeCanvasAndContext2.default)({
                    width: size,
                    height: size
                }, {}, 1, !0).ctx;
                ctx.fillStyle = color, ctx.fillRect(0, 0, size, size);
                var data = ctx.getImageData(0, 0, size, size).data;
                return {
                    r: data[0],
                    g: data[1],
                    b: data[2],
                    a: data[3] / 255
                };
            };
            var _makeCanvasAndContext = _dereq_('./makeCanvasAndContext'), _makeCanvasAndContext2 = _interopRequireDefault(_makeCanvasAndContext);
            module.exports = exports.default;
        }, {
            './makeCanvasAndContext': 26
        } ],
        29: [ function(_dereq_, module, exports) {
            'use strict';
            Object.defineProperty(exports, '__esModule', {
                value: !0
            });
            var _extends = Object.assign || function(target) {
                for (var i = 1; i < arguments.length; i++) {
                    var source = arguments[i];
                    for (var key in source) {
                        Object.prototype.hasOwnProperty.call(source, key) && (target[key] = source[key]);
                    }
                }
                return target;
            };
            exports.default = function(colorObj) {
                var c = _extends({
                    a: 1
                }, colorObj);
                return 'rgba(' + c.r + ', ' + c.g + ', ' + c.b + ', ' + c.a + ')';
            }, module.exports = exports.default;
        }, {} ],
        30: [ function(_dereq_, module, exports) {
            'use strict';
            function _interopRequireDefault(obj) {
                return obj && obj.__esModule ? obj : {
                    default: obj
                };
            }
            function worker(self) {
                self.addEventListener('message', function(msg) {
                    if (msg.data.imageData && msg.data.params) {
                        try {
                            var imageData = msg.data.imageData;
                            'undefined' == typeof imageData.width && 'number' == typeof msg.data.imageDataWidth && (imageData.width = msg.data.imageDataWidth), 
                            'undefined' == typeof imageData.height && 'number' == typeof msg.data.imageDataHeight && (imageData.height = msg.data.imageDataHeight);
                            var polygons = (0, _imageDataToPolygons2.default)(msg.data.imageData, msg.data.params);
                            self.postMessage({
                                polygonJSONStr: JSON.stringify(polygons)
                            });
                        } catch (err) {
                            self.postMessage({
                                err: err.message || err
                            });
                        }
                    } else {
                        msg.data.imageData ? self.postMessage({
                            err: 'Parameters are missing.'
                        }) : self.postMessage({
                            err: 'ImageData is missing.'
                        });
                    }
                    self.close();
                });
            }
            Object.defineProperty(exports, '__esModule', {
                value: !0
            }), exports.default = worker;
            var _imageDataToPolygons = _dereq_('../polygons/imageDataToPolygons'), _imageDataToPolygons2 = _interopRequireDefault(_imageDataToPolygons);
            module.exports = exports.default;
        }, {
            '../polygons/imageDataToPolygons': 16
        } ],
        31: [ function(_dereq_, module, exports) {
            var Canvas = module.exports = function Canvas(w, h) {
                var canvas = document.createElement('canvas');
                canvas.width = w || 300;
                canvas.height = h || 150;
                return canvas;
            };
            Canvas.Image = function() {
                var img = document.createElement('img');
                return img;
            };
        }, {} ],
        32: [ function(_dereq_, module, exports) {
            function Triangle(a, b, c) {
                this.a = a;
                this.b = b;
                this.c = c;
                var A = b.x - a.x, B = b.y - a.y, C = c.x - a.x, D = c.y - a.y, E = A * (a.x + b.x) + B * (a.y + b.y), F = C * (a.x + c.x) + D * (a.y + c.y), G = 2 * (A * (c.y - b.y) - B * (c.x - b.x)), minx, miny, dx, dy;
                if (Math.abs(G) < 1e-6) {
                    minx = Math.min(a.x, b.x, c.x);
                    miny = Math.min(a.y, b.y, c.y);
                    dx = (Math.max(a.x, b.x, c.x) - minx) * .5;
                    dy = (Math.max(a.y, b.y, c.y) - miny) * .5;
                    this.x = minx + dx;
                    this.y = miny + dy;
                    this.r = dx * dx + dy * dy;
                } else {
                    this.x = (D * E - B * F) / G;
                    this.y = (A * F - C * E) / G;
                    dx = this.x - a.x;
                    dy = this.y - a.y;
                    this.r = dx * dx + dy * dy;
                }
            }
            Triangle.prototype.draw = function(ctx) {
                ctx.beginPath();
                ctx.moveTo(this.a.x, this.a.y);
                ctx.lineTo(this.b.x, this.b.y);
                ctx.lineTo(this.c.x, this.c.y);
                ctx.closePath();
                ctx.stroke();
            };
            function byX(a, b) {
                return b.x - a.x;
            }
            function dedup(edges) {
                var j = edges.length, a, b, i, m, n;
                outer: while (j) {
                    b = edges[--j];
                    a = edges[--j];
                    i = j;
                    while (i) {
                        n = edges[--i];
                        m = edges[--i];
                        if (a === m && b === n || a === n && b === m) {
                            edges.splice(j, 2);
                            edges.splice(i, 2);
                            j -= 2;
                            continue outer;
                        }
                    }
                }
            }
            function triangulate(vertices) {
                if (vertices.length < 3) {
                    return [];
                }
                vertices.sort(byX);
                var i = vertices.length - 1, xmin = vertices[i].x, xmax = vertices[0].x, ymin = vertices[i].y, ymax = ymin;
                while (i--) {
                    if (vertices[i].y < ymin) {
                        ymin = vertices[i].y;
                    }
                    if (vertices[i].y > ymax) {
                        ymax = vertices[i].y;
                    }
                }
                var dx = xmax - xmin, dy = ymax - ymin, dmax = dx > dy ? dx : dy, xmid = (xmax + xmin) * .5, ymid = (ymax + ymin) * .5, open = [ new Triangle({
                    x: xmid - 20 * dmax,
                    y: ymid - dmax,
                    __sentinel: true
                }, {
                    x: xmid,
                    y: ymid + 20 * dmax,
                    __sentinel: true
                }, {
                    x: xmid + 20 * dmax,
                    y: ymid - dmax,
                    __sentinel: true
                }) ], closed = [], edges = [], j, a, b;
                i = vertices.length;
                while (i--) {
                    edges.length = 0;
                    j = open.length;
                    while (j--) {
                        dx = vertices[i].x - open[j].x;
                        if (dx > 0 && dx * dx > open[j].r) {
                            closed.push(open[j]);
                            open.splice(j, 1);
                            continue;
                        }
                        dy = vertices[i].y - open[j].y;
                        if (dx * dx + dy * dy > open[j].r) {
                            continue;
                        }
                        edges.push(open[j].a, open[j].b, open[j].b, open[j].c, open[j].c, open[j].a);
                        open.splice(j, 1);
                    }
                    dedup(edges);
                    j = edges.length;
                    while (j) {
                        b = edges[--j];
                        a = edges[--j];
                        open.push(new Triangle(a, b, vertices[i]));
                    }
                }
                Array.prototype.push.apply(closed, open);
                i = closed.length;
                while (i--) {
                    if (closed[i].a.__sentinel || closed[i].b.__sentinel || closed[i].c.__sentinel) {
                        closed.splice(i, 1);
                    }
                }
                return closed;
            }
            if (typeof module !== 'undefined') {
                module.exports = {
                    Triangle: Triangle,
                    triangulate: triangulate
                };
            }
        }, {} ],
        33: [ function(_dereq_, module, exports) {
            (function(root) {
                'use strict';
                function Sobel(imageData) {
                    if (!(this instanceof Sobel)) {
                        return new Sobel(imageData);
                    }
                    var width = imageData.width;
                    var height = imageData.height;
                    var kernelX = [ [ -1, 0, 1 ], [ -2, 0, 2 ], [ -1, 0, 1 ] ];
                    var kernelY = [ [ -1, -2, -1 ], [ 0, 0, 0 ], [ 1, 2, 1 ] ];
                    var sobelData = [];
                    var grayscaleData = [];
                    function bindPixelAt(data) {
                        return function(x, y, i) {
                            i = i || 0;
                            return data[(width * y + x) * 4 + i];
                        };
                    }
                    var data = imageData.data;
                    var pixelAt = bindPixelAt(data);
                    var x, y;
                    for (y = 0; y < height; y++) {
                        for (x = 0; x < width; x++) {
                            var r = pixelAt(x, y, 0);
                            var g = pixelAt(x, y, 1);
                            var b = pixelAt(x, y, 2);
                            var avg = (r + g + b) / 3;
                            grayscaleData.push(avg, avg, avg, 255);
                        }
                    }
                    pixelAt = bindPixelAt(grayscaleData);
                    for (y = 0; y < height; y++) {
                        for (x = 0; x < width; x++) {
                            var pixelX = kernelX[0][0] * pixelAt(x - 1, y - 1) + kernelX[0][1] * pixelAt(x, y - 1) + kernelX[0][2] * pixelAt(x + 1, y - 1) + kernelX[1][0] * pixelAt(x - 1, y) + kernelX[1][1] * pixelAt(x, y) + kernelX[1][2] * pixelAt(x + 1, y) + kernelX[2][0] * pixelAt(x - 1, y + 1) + kernelX[2][1] * pixelAt(x, y + 1) + kernelX[2][2] * pixelAt(x + 1, y + 1);
                            var pixelY = kernelY[0][0] * pixelAt(x - 1, y - 1) + kernelY[0][1] * pixelAt(x, y - 1) + kernelY[0][2] * pixelAt(x + 1, y - 1) + kernelY[1][0] * pixelAt(x - 1, y) + kernelY[1][1] * pixelAt(x, y) + kernelY[1][2] * pixelAt(x + 1, y) + kernelY[2][0] * pixelAt(x - 1, y + 1) + kernelY[2][1] * pixelAt(x, y + 1) + kernelY[2][2] * pixelAt(x + 1, y + 1);
                            var magnitude = Math.sqrt(pixelX * pixelX + pixelY * pixelY) >>> 0;
                            sobelData.push(magnitude, magnitude, magnitude, 255);
                        }
                    }
                    var clampedArray = sobelData;
                    if (typeof Uint8ClampedArray === 'function') {
                        clampedArray = new Uint8ClampedArray(sobelData);
                    }
                    clampedArray.toImageData = function() {
                        return Sobel.toImageData(clampedArray, width, height);
                    };
                    return clampedArray;
                }
                Sobel.toImageData = function toImageData(data, width, height) {
                    if (typeof ImageData === 'function' && Object.prototype.toString.call(data) === '[object Uint16Array]') {
                        return new ImageData(data, width, height);
                    } else {
                        if (typeof window === 'object' && typeof window.document === 'object') {
                            var canvas = document.createElement('canvas');
                            if (typeof canvas.getContext === 'function') {
                                var context = canvas.getContext('2d');
                                var imageData = context.createImageData(width, height);
                                imageData.data.set(data);
                                return imageData;
                            } else {
                                return new FakeImageData(data, width, height);
                            }
                        } else {
                            return new FakeImageData(data, width, height);
                        }
                    }
                };
                function FakeImageData(data, width, height) {
                    return {
                        width: width,
                        height: height,
                        data: data
                    };
                }
                if (typeof exports !== 'undefined') {
                    if (typeof module !== 'undefined' && module.exports) {
                        exports = module.exports = Sobel;
                    }
                    exports.Sobel = Sobel;
                } else {
                    if (typeof define === 'function' && define.amd) {
                        define([], function() {
                            return Sobel;
                        });
                    } else {
                        root.Sobel = Sobel;
                    }
                }
            })(this);
        }, {} ],
        34: [ function(_dereq_, module, exports) {
            var mul_table = [ 512, 512, 456, 512, 328, 456, 335, 512, 405, 328, 271, 456, 388, 335, 292, 512, 454, 405, 364, 328, 298, 271, 496, 456, 420, 388, 360, 335, 312, 292, 273, 512, 482, 454, 428, 405, 383, 364, 345, 328, 312, 298, 284, 271, 259, 496, 475, 456, 437, 420, 404, 388, 374, 360, 347, 335, 323, 312, 302, 292, 282, 273, 265, 512, 497, 482, 468, 454, 441, 428, 417, 405, 394, 383, 373, 364, 354, 345, 337, 328, 320, 312, 305, 298, 291, 284, 278, 271, 265, 259, 507, 496, 485, 475, 465, 456, 446, 437, 428, 420, 412, 404, 396, 388, 381, 374, 367, 360, 354, 347, 341, 335, 329, 323, 318, 312, 307, 302, 297, 292, 287, 282, 278, 273, 269, 265, 261, 512, 505, 497, 489, 482, 475, 468, 461, 454, 447, 441, 435, 428, 422, 417, 411, 405, 399, 394, 389, 383, 378, 373, 368, 364, 359, 354, 350, 345, 341, 337, 332, 328, 324, 320, 316, 312, 309, 305, 301, 298, 294, 291, 287, 284, 281, 278, 274, 271, 268, 265, 262, 259, 257, 507, 501, 496, 491, 485, 480, 475, 470, 465, 460, 456, 451, 446, 442, 437, 433, 428, 424, 420, 416, 412, 408, 404, 400, 396, 392, 388, 385, 381, 377, 374, 370, 367, 363, 360, 357, 354, 350, 347, 344, 341, 338, 335, 332, 329, 326, 323, 320, 318, 315, 312, 310, 307, 304, 302, 299, 297, 294, 292, 289, 287, 285, 282, 280, 278, 275, 273, 271, 269, 267, 265, 263, 261, 259 ];
            var shg_table = [ 9, 11, 12, 13, 13, 14, 14, 15, 15, 15, 15, 16, 16, 16, 16, 17, 17, 17, 17, 17, 17, 17, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24 ];
            function processImage(img, canvas, radius, blurAlphaChannel) {
                if (typeof img == 'string') {
                    var img = document.getElementById(img);
                } else {
                    if (!img instanceof HTMLImageElement) {
                        return;
                    }
                }
                var w = img.naturalWidth;
                var h = img.naturalHeight;
                if (typeof canvas == 'string') {
                    var canvas = document.getElementById(canvas);
                } else {
                    if (!canvas instanceof HTMLCanvasElement) {
                        return;
                    }
                }
                canvas.style.width = w + 'px';
                canvas.style.height = h + 'px';
                canvas.width = w;
                canvas.height = h;
                var context = canvas.getContext('2d');
                context.clearRect(0, 0, w, h);
                context.drawImage(img, 0, 0);
                if (isNaN(radius) || radius < 1) {
                    return;
                }
                if (blurAlphaChannel) {
                    processCanvasRGBA(canvas, 0, 0, w, h, radius);
                } else {
                    processCanvasRGB(canvas, 0, 0, w, h, radius);
                }
            }
            function getImageDataFromCanvas(canvas, top_x, top_y, width, height) {
                if (typeof canvas == 'string') {
                    var canvas = document.getElementById(canvas);
                } else {
                    if (!canvas instanceof HTMLCanvasElement) {
                        return;
                    }
                }
                var context = canvas.getContext('2d');
                var imageData;
                try {
                    try {
                        imageData = context.getImageData(top_x, top_y, width, height);
                    } catch (e) {
                        throw new Error('unable to access local image data: ' + e);
                        return;
                    }
                } catch (e) {
                    throw new Error('unable to access image data: ' + e);
                }
                return imageData;
            }
            function processCanvasRGBA(canvas, top_x, top_y, width, height, radius) {
                if (isNaN(radius) || radius < 1) {
                    return;
                }
                radius |= 0;
                var imageData = getImageDataFromCanvas(canvas, top_x, top_y, width, height);
                imageData = processImageDataRGBA(imageData, top_x, top_y, width, height, radius);
                canvas.getContext('2d').putImageData(imageData, top_x, top_y);
            }
            function processImageDataRGBA(imageData, top_x, top_y, width, height, radius) {
                var pixels = imageData.data;
                var x, y, i, p, yp, yi, yw, r_sum, g_sum, b_sum, a_sum, r_out_sum, g_out_sum, b_out_sum, a_out_sum, r_in_sum, g_in_sum, b_in_sum, a_in_sum, pr, pg, pb, pa, rbs;
                var div = radius + radius + 1;
                var w4 = width << 2;
                var widthMinus1 = width - 1;
                var heightMinus1 = height - 1;
                var radiusPlus1 = radius + 1;
                var sumFactor = radiusPlus1 * (radiusPlus1 + 1) / 2;
                var stackStart = new BlurStack();
                var stack = stackStart;
                for (i = 1; i < div; i++) {
                    stack = stack.next = new BlurStack();
                    if (i == radiusPlus1) {
                        var stackEnd = stack;
                    }
                }
                stack.next = stackStart;
                var stackIn = null;
                var stackOut = null;
                yw = yi = 0;
                var mul_sum = mul_table[radius];
                var shg_sum = shg_table[radius];
                for (y = 0; y < height; y++) {
                    r_in_sum = g_in_sum = b_in_sum = a_in_sum = r_sum = g_sum = b_sum = a_sum = 0;
                    r_out_sum = radiusPlus1 * (pr = pixels[yi]);
                    g_out_sum = radiusPlus1 * (pg = pixels[yi + 1]);
                    b_out_sum = radiusPlus1 * (pb = pixels[yi + 2]);
                    a_out_sum = radiusPlus1 * (pa = pixels[yi + 3]);
                    r_sum += sumFactor * pr;
                    g_sum += sumFactor * pg;
                    b_sum += sumFactor * pb;
                    a_sum += sumFactor * pa;
                    stack = stackStart;
                    for (i = 0; i < radiusPlus1; i++) {
                        stack.r = pr;
                        stack.g = pg;
                        stack.b = pb;
                        stack.a = pa;
                        stack = stack.next;
                    }
                    for (i = 1; i < radiusPlus1; i++) {
                        p = yi + ((widthMinus1 < i ? widthMinus1 : i) << 2);
                        r_sum += (stack.r = pr = pixels[p]) * (rbs = radiusPlus1 - i);
                        g_sum += (stack.g = pg = pixels[p + 1]) * rbs;
                        b_sum += (stack.b = pb = pixels[p + 2]) * rbs;
                        a_sum += (stack.a = pa = pixels[p + 3]) * rbs;
                        r_in_sum += pr;
                        g_in_sum += pg;
                        b_in_sum += pb;
                        a_in_sum += pa;
                        stack = stack.next;
                    }
                    stackIn = stackStart;
                    stackOut = stackEnd;
                    for (x = 0; x < width; x++) {
                        pixels[yi + 3] = pa = a_sum * mul_sum >> shg_sum;
                        if (pa != 0) {
                            pa = 255 / pa;
                            pixels[yi] = (r_sum * mul_sum >> shg_sum) * pa;
                            pixels[yi + 1] = (g_sum * mul_sum >> shg_sum) * pa;
                            pixels[yi + 2] = (b_sum * mul_sum >> shg_sum) * pa;
                        } else {
                            pixels[yi] = pixels[yi + 1] = pixels[yi + 2] = 0;
                        }
                        r_sum -= r_out_sum;
                        g_sum -= g_out_sum;
                        b_sum -= b_out_sum;
                        a_sum -= a_out_sum;
                        r_out_sum -= stackIn.r;
                        g_out_sum -= stackIn.g;
                        b_out_sum -= stackIn.b;
                        a_out_sum -= stackIn.a;
                        p = yw + ((p = x + radius + 1) < widthMinus1 ? p : widthMinus1) << 2;
                        r_in_sum += stackIn.r = pixels[p];
                        g_in_sum += stackIn.g = pixels[p + 1];
                        b_in_sum += stackIn.b = pixels[p + 2];
                        a_in_sum += stackIn.a = pixels[p + 3];
                        r_sum += r_in_sum;
                        g_sum += g_in_sum;
                        b_sum += b_in_sum;
                        a_sum += a_in_sum;
                        stackIn = stackIn.next;
                        r_out_sum += pr = stackOut.r;
                        g_out_sum += pg = stackOut.g;
                        b_out_sum += pb = stackOut.b;
                        a_out_sum += pa = stackOut.a;
                        r_in_sum -= pr;
                        g_in_sum -= pg;
                        b_in_sum -= pb;
                        a_in_sum -= pa;
                        stackOut = stackOut.next;
                        yi += 4;
                    }
                    yw += width;
                }
                for (x = 0; x < width; x++) {
                    g_in_sum = b_in_sum = a_in_sum = r_in_sum = g_sum = b_sum = a_sum = r_sum = 0;
                    yi = x << 2;
                    r_out_sum = radiusPlus1 * (pr = pixels[yi]);
                    g_out_sum = radiusPlus1 * (pg = pixels[yi + 1]);
                    b_out_sum = radiusPlus1 * (pb = pixels[yi + 2]);
                    a_out_sum = radiusPlus1 * (pa = pixels[yi + 3]);
                    r_sum += sumFactor * pr;
                    g_sum += sumFactor * pg;
                    b_sum += sumFactor * pb;
                    a_sum += sumFactor * pa;
                    stack = stackStart;
                    for (i = 0; i < radiusPlus1; i++) {
                        stack.r = pr;
                        stack.g = pg;
                        stack.b = pb;
                        stack.a = pa;
                        stack = stack.next;
                    }
                    yp = width;
                    for (i = 1; i <= radius; i++) {
                        yi = yp + x << 2;
                        r_sum += (stack.r = pr = pixels[yi]) * (rbs = radiusPlus1 - i);
                        g_sum += (stack.g = pg = pixels[yi + 1]) * rbs;
                        b_sum += (stack.b = pb = pixels[yi + 2]) * rbs;
                        a_sum += (stack.a = pa = pixels[yi + 3]) * rbs;
                        r_in_sum += pr;
                        g_in_sum += pg;
                        b_in_sum += pb;
                        a_in_sum += pa;
                        stack = stack.next;
                        if (i < heightMinus1) {
                            yp += width;
                        }
                    }
                    yi = x;
                    stackIn = stackStart;
                    stackOut = stackEnd;
                    for (y = 0; y < height; y++) {
                        p = yi << 2;
                        pixels[p + 3] = pa = a_sum * mul_sum >> shg_sum;
                        if (pa > 0) {
                            pa = 255 / pa;
                            pixels[p] = (r_sum * mul_sum >> shg_sum) * pa;
                            pixels[p + 1] = (g_sum * mul_sum >> shg_sum) * pa;
                            pixels[p + 2] = (b_sum * mul_sum >> shg_sum) * pa;
                        } else {
                            pixels[p] = pixels[p + 1] = pixels[p + 2] = 0;
                        }
                        r_sum -= r_out_sum;
                        g_sum -= g_out_sum;
                        b_sum -= b_out_sum;
                        a_sum -= a_out_sum;
                        r_out_sum -= stackIn.r;
                        g_out_sum -= stackIn.g;
                        b_out_sum -= stackIn.b;
                        a_out_sum -= stackIn.a;
                        p = x + ((p = y + radiusPlus1) < heightMinus1 ? p : heightMinus1) * width << 2;
                        r_sum += r_in_sum += stackIn.r = pixels[p];
                        g_sum += g_in_sum += stackIn.g = pixels[p + 1];
                        b_sum += b_in_sum += stackIn.b = pixels[p + 2];
                        a_sum += a_in_sum += stackIn.a = pixels[p + 3];
                        stackIn = stackIn.next;
                        r_out_sum += pr = stackOut.r;
                        g_out_sum += pg = stackOut.g;
                        b_out_sum += pb = stackOut.b;
                        a_out_sum += pa = stackOut.a;
                        r_in_sum -= pr;
                        g_in_sum -= pg;
                        b_in_sum -= pb;
                        a_in_sum -= pa;
                        stackOut = stackOut.next;
                        yi += width;
                    }
                }
                return imageData;
            }
            function processCanvasRGB(canvas, top_x, top_y, width, height, radius) {
                if (isNaN(radius) || radius < 1) {
                    return;
                }
                radius |= 0;
                var imageData = getImageDataFromCanvas(canvas, top_x, top_y, width, height);
                imageData = processImageDataRGB(imageData, top_x, top_y, width, height, radius);
                canvas.getContext('2d').putImageData(imageData, top_x, top_y);
            }
            function processImageDataRGB(imageData, top_x, top_y, width, height, radius) {
                var pixels = imageData.data;
                var x, y, i, p, yp, yi, yw, r_sum, g_sum, b_sum, r_out_sum, g_out_sum, b_out_sum, r_in_sum, g_in_sum, b_in_sum, pr, pg, pb, rbs;
                var div = radius + radius + 1;
                var w4 = width << 2;
                var widthMinus1 = width - 1;
                var heightMinus1 = height - 1;
                var radiusPlus1 = radius + 1;
                var sumFactor = radiusPlus1 * (radiusPlus1 + 1) / 2;
                var stackStart = new BlurStack();
                var stack = stackStart;
                for (i = 1; i < div; i++) {
                    stack = stack.next = new BlurStack();
                    if (i == radiusPlus1) {
                        var stackEnd = stack;
                    }
                }
                stack.next = stackStart;
                var stackIn = null;
                var stackOut = null;
                yw = yi = 0;
                var mul_sum = mul_table[radius];
                var shg_sum = shg_table[radius];
                for (y = 0; y < height; y++) {
                    r_in_sum = g_in_sum = b_in_sum = r_sum = g_sum = b_sum = 0;
                    r_out_sum = radiusPlus1 * (pr = pixels[yi]);
                    g_out_sum = radiusPlus1 * (pg = pixels[yi + 1]);
                    b_out_sum = radiusPlus1 * (pb = pixels[yi + 2]);
                    r_sum += sumFactor * pr;
                    g_sum += sumFactor * pg;
                    b_sum += sumFactor * pb;
                    stack = stackStart;
                    for (i = 0; i < radiusPlus1; i++) {
                        stack.r = pr;
                        stack.g = pg;
                        stack.b = pb;
                        stack = stack.next;
                    }
                    for (i = 1; i < radiusPlus1; i++) {
                        p = yi + ((widthMinus1 < i ? widthMinus1 : i) << 2);
                        r_sum += (stack.r = pr = pixels[p]) * (rbs = radiusPlus1 - i);
                        g_sum += (stack.g = pg = pixels[p + 1]) * rbs;
                        b_sum += (stack.b = pb = pixels[p + 2]) * rbs;
                        r_in_sum += pr;
                        g_in_sum += pg;
                        b_in_sum += pb;
                        stack = stack.next;
                    }
                    stackIn = stackStart;
                    stackOut = stackEnd;
                    for (x = 0; x < width; x++) {
                        pixels[yi] = r_sum * mul_sum >> shg_sum;
                        pixels[yi + 1] = g_sum * mul_sum >> shg_sum;
                        pixels[yi + 2] = b_sum * mul_sum >> shg_sum;
                        r_sum -= r_out_sum;
                        g_sum -= g_out_sum;
                        b_sum -= b_out_sum;
                        r_out_sum -= stackIn.r;
                        g_out_sum -= stackIn.g;
                        b_out_sum -= stackIn.b;
                        p = yw + ((p = x + radius + 1) < widthMinus1 ? p : widthMinus1) << 2;
                        r_in_sum += stackIn.r = pixels[p];
                        g_in_sum += stackIn.g = pixels[p + 1];
                        b_in_sum += stackIn.b = pixels[p + 2];
                        r_sum += r_in_sum;
                        g_sum += g_in_sum;
                        b_sum += b_in_sum;
                        stackIn = stackIn.next;
                        r_out_sum += pr = stackOut.r;
                        g_out_sum += pg = stackOut.g;
                        b_out_sum += pb = stackOut.b;
                        r_in_sum -= pr;
                        g_in_sum -= pg;
                        b_in_sum -= pb;
                        stackOut = stackOut.next;
                        yi += 4;
                    }
                    yw += width;
                }
                for (x = 0; x < width; x++) {
                    g_in_sum = b_in_sum = r_in_sum = g_sum = b_sum = r_sum = 0;
                    yi = x << 2;
                    r_out_sum = radiusPlus1 * (pr = pixels[yi]);
                    g_out_sum = radiusPlus1 * (pg = pixels[yi + 1]);
                    b_out_sum = radiusPlus1 * (pb = pixels[yi + 2]);
                    r_sum += sumFactor * pr;
                    g_sum += sumFactor * pg;
                    b_sum += sumFactor * pb;
                    stack = stackStart;
                    for (i = 0; i < radiusPlus1; i++) {
                        stack.r = pr;
                        stack.g = pg;
                        stack.b = pb;
                        stack = stack.next;
                    }
                    yp = width;
                    for (i = 1; i <= radius; i++) {
                        yi = yp + x << 2;
                        r_sum += (stack.r = pr = pixels[yi]) * (rbs = radiusPlus1 - i);
                        g_sum += (stack.g = pg = pixels[yi + 1]) * rbs;
                        b_sum += (stack.b = pb = pixels[yi + 2]) * rbs;
                        r_in_sum += pr;
                        g_in_sum += pg;
                        b_in_sum += pb;
                        stack = stack.next;
                        if (i < heightMinus1) {
                            yp += width;
                        }
                    }
                    yi = x;
                    stackIn = stackStart;
                    stackOut = stackEnd;
                    for (y = 0; y < height; y++) {
                        p = yi << 2;
                        pixels[p] = r_sum * mul_sum >> shg_sum;
                        pixels[p + 1] = g_sum * mul_sum >> shg_sum;
                        pixels[p + 2] = b_sum * mul_sum >> shg_sum;
                        r_sum -= r_out_sum;
                        g_sum -= g_out_sum;
                        b_sum -= b_out_sum;
                        r_out_sum -= stackIn.r;
                        g_out_sum -= stackIn.g;
                        b_out_sum -= stackIn.b;
                        p = x + ((p = y + radiusPlus1) < heightMinus1 ? p : heightMinus1) * width << 2;
                        r_sum += r_in_sum += stackIn.r = pixels[p];
                        g_sum += g_in_sum += stackIn.g = pixels[p + 1];
                        b_sum += b_in_sum += stackIn.b = pixels[p + 2];
                        stackIn = stackIn.next;
                        r_out_sum += pr = stackOut.r;
                        g_out_sum += pg = stackOut.g;
                        b_out_sum += pb = stackOut.b;
                        r_in_sum -= pr;
                        g_in_sum -= pg;
                        b_in_sum -= pb;
                        stackOut = stackOut.next;
                        yi += width;
                    }
                }
                return imageData;
            }
            function BlurStack() {
                this.r = 0;
                this.g = 0;
                this.b = 0;
                this.a = 0;
                this.next = null;
            }
            module.exports = {
                image: processImage,
                canvasRGBA: processCanvasRGBA,
                canvasRGB: processCanvasRGB,
                imageDataRGBA: processImageDataRGBA,
                imageDataRGB: processImageDataRGB
            };
        }, {} ],
        35: [ function(_dereq_, module, exports) {
            var bundleFn = arguments[3];
            var sources = arguments[4];
            var cache = arguments[5];
            var stringify = JSON.stringify;
            module.exports = function(fn, options) {
                var wkey;
                var cacheKeys = Object.keys(cache);
                for (var i = 0, l = cacheKeys.length; i < l; i++) {
                    var key = cacheKeys[i];
                    var exp = cache[key].exports;
                    if (exp === fn || exp && exp.default === fn) {
                        wkey = key;
                        break;
                    }
                }
                if (!wkey) {
                    wkey = Math.floor(Math.pow(16, 8) * Math.random()).toString(16);
                    var wcache = {};
                    for (var i = 0, l = cacheKeys.length; i < l; i++) {
                        var key = cacheKeys[i];
                        wcache[key] = key;
                    }
                    sources[wkey] = [ Function([ 'require', 'module', 'exports' ], '(' + fn + ')(self)'), wcache ];
                }
                var skey = Math.floor(Math.pow(16, 8) * Math.random()).toString(16);
                var scache = {};
                scache[wkey] = wkey;
                sources[skey] = [ Function([ 'require' ], 'var f = require(' + stringify(wkey) + ');' + '(f.default ? f.default : f)(self);'), scache ];
                var src = '(' + bundleFn + ')({' + Object.keys(sources).map(function(key) {
                    return stringify(key) + ':[' + sources[key][0] + ',' + stringify(sources[key][1]) + ']';
                }).join(',') + '},{},[' + stringify(skey) + '])';
                var URL = window.URL || window.webkitURL || window.mozURL || window.msURL;
                var blob = new Blob([ src ], {
                    type: 'text/javascript'
                });
                if (options && options.bare) {
                    return blob;
                }
                var workerUrl = URL.createObjectURL(blob);
                var worker = new Worker(workerUrl);
                worker.objectURL = workerUrl;
                return worker;
            };
        }, {} ]
    }, {}, [ 1 ])(1);
});
