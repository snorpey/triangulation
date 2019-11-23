(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global = global || self, global.triangulate = factory());
}(this, function () { 'use strict';

	function clamp ( value, min, max ) {
		return value < min ? min : value > max ? max : value;
	}

	function clone (obj) {
		var result = false;
		
		if ( typeof obj !== 'undefined' ) {
			try {
				result = JSON.parse( JSON.stringify( obj ) );
			} catch ( e ) { }
		}
		
		return result;
	}

	var Canvas = function Canvas ( width, height ) {
		if ( width === void 0 ) width = 300;
		if ( height === void 0 ) height = 150;

		if ( typeof window === 'undefined' ) {
			this.canvasEl = { width: width, height: height };
			this.ctx = null;
		} else {
			this.canvasEl = document.createElement( 'canvas' );
			this.canvasEl.width = width;
			this.canvasEl.height = height;
			this.ctx = this.canvasEl.getContext( '2d' );
		} 
	};

	var prototypeAccessors = { width: { configurable: true },height: { configurable: true } };

	Canvas.prototype.getContext = function getContext () {
		return this.ctx;
	};

	Canvas.prototype.toDataURL = function toDataURL ( type, encoderOptions, cb ) {
		if ( typeof cb === 'function' ) {
			cb( this.canvasEl.toDataURL( type, encoderOptions ) );
		} else {
			return this.canvasEl.toDataURL( type, encoderOptions );
		}
	};
		
	prototypeAccessors.width.get = function () {
		return this.canvasEl.width;
	};
		
	prototypeAccessors.width.set = function ( newWidth ) {
		this.canvasEl.width = newWidth;
	};

	prototypeAccessors.height.get = function () {
		return this.canvasEl.height;
	};

	prototypeAccessors.height.set = function ( newHeight ) {
		this.canvasEl.height = newHeight;
	};

	Object.defineProperties( Canvas.prototype, prototypeAccessors );

	if ( typeof window !== 'undefined' ) {
		Canvas.Image = Image;
	}

	// import Canvas from 'canvas';

	function makeCanvasAndContext ( size, options, dpr, format ) {
		var backgroundColor = options && options.backgroundColor ? options.backgroundColor : false;
		var canvas = new Canvas( size.width * dpr, size.height * dpr, format );
		var ctx = canvas.getContext( '2d' );

		if ( backgroundColor ) {
			ctx.fillStyle = backgroundColor;
			ctx.fillRect( 0, 0, size.width * dpr, size.height * dpr );
			ctx.fillStyle = 'transparent';
		}

		return {
			canvas: canvas,
			ctx: ctx
		};
	}

	/**
	 * Transform CSS color definition to RGBA
	 * @param  {String} color CSS color (name,HSL,RGB,HEX..)
	 * @return {Object}       RGBA color object
	 */
	function toColor (color) {
		var size = 1;		// single pixel
		var ctx = makeCanvasAndContext( { width: size, height: size }, { }, 1, true ).ctx;
		ctx.fillStyle = color;
		ctx.fillRect( 0, 0, size, size );
		
		// Read the pixel, and get RGBA values
		var data = ctx.getImageData( 0, 0, size, size ).data;
		
		return {
			r: data[0],
			g: data[1],
			b: data[2],
			a: data[3] / 255		// For alpha we scale to 0..1 float
		};
	}

	var defaultParams = {
		accuracy: 0.7,
		blur: 4,
		fill: true,
		stroke: true,
		strokeWidth: 0.5,
		lineJoin: 'miter',
		vertexCount: 700,
		threshold: 50,
		transparentColor: false
	};

	var allowedLineJoins = [ 'miter', 'round', 'bevel' ];

	function sanitizeInput (params) {
		
		params = clone( params );

		if ( typeof params !== 'object' ) {
			params = { };
		}

		if ( typeof params.accuracy !== 'number' || isNaN( params.accuracy ) ) {
			params.accuracy = defaultParams.accuracy;
		} else {
			params.accuracy = clamp( params.accuracy, 0, 1 );
		}

		if ( typeof params.blur !== 'number' || isNaN( params.blur ) ) {
			params.blur = defaultParams.blur;	
		}

		if ( params.blur <= 0 ) {
			params.blur = 1;
		}

		if ( typeof params.fill !== 'string' && typeof params.fill !== 'boolean' ) {
			params.fill = defaultParams.fill;
		}

		if ( typeof params.stroke !== 'string' && typeof params.stroke !== 'boolean' ) {
			params.stroke = defaultParams.stroke;
		}

		if ( typeof params.strokeWidth !== 'number' || isNaN( params.strokeWidth ) ) {
			params.strokeWidth = defaultParams.strokeWidth;
		}

		if ( typeof params.threshold !== 'number' || isNaN( params.threshold ) ) {
			params.threshold = defaultParams.threshold;
		} else {
			params.threshold = clamp( params.threshold, 1, 100 );
		}

		if ( typeof params.lineJoin !== 'string' || allowedLineJoins.indexOf( params.lineJoin ) === -1 ) {
			params.lineJoin = defaultParams.lineJoin;
		}

		if ( params.gradients && params.fill ) {
			params.gradients = true;
		} else {
			params.gradients = false;
		}

		if ( params.gradients ) {
			if (
				typeof params.gradientStops !== 'number' ||
				isNaN( params.gradientStops ) ||
				params.gradientStops < 2
			) {
				params.gradientStops = 2;
			}

			params.gradientStops = Math.round( params.gradientStops );
		}

		if ( typeof params.vertexCount !== 'number' || isNaN( params.vertexCount ) ) {
			params.vertexCount = defaultParams.vertexCount;
		}

		if ( params.vertexCount <= 0 ) {
			params.vertexCount = 1;
		}

		if ( typeof params.transparentColor !== 'string' && typeof params.transparentColor !== 'boolean' ) {
			params.transparentColor = defaultParams.transparentColor;
		}

		// "transparentColor=true" is meaningless
		if ( typeof params.transparentColor === true ) {
			params.transparentColor = false;
		}

		// Transform `transparentColor` string to RGBA color object
		if ( typeof params.transparentColor === 'string' ) {
			params.transparentColor = toColor( params.transparentColor );
		}

		return params;
	}

	function fromImageToImageData (image) {
		if ( image instanceof HTMLImageElement ) {
			// http://stackoverflow.com/a/3016076/229189
			if ( ! image.naturalWidth || ! image.naturalHeight || image.complete === false ) {
				throw new Error( "This this image hasn't finished loading: " + image.src );
			}

			var canvas = new Canvas( image.naturalWidth, image.naturalHeight );
			var ctx = canvas.getContext( '2d' );
			
			ctx.drawImage( image, 0, 0, canvas.width, canvas.height );

			var imageData = ctx.getImageData( 0, 0, canvas.width, canvas.height );

			if ( imageData.data && imageData.data.length ) {
				if ( typeof imageData.width === 'undefined' ) {
					imageData.width = image.naturalWidth;
				}

				if ( typeof imageData.height === 'undefined' ) {
					imageData.height = image.naturalHeight;
				}
			}
			
			return imageData;
		} else {
			throw new Error( 'This object does not seem to be an image.' );
			return;
		}
	}

	/*
	object-assign
	(c) Sindre Sorhus
	@license MIT
	*/
	/* eslint-disable no-unused-vars */
	var getOwnPropertySymbols = Object.getOwnPropertySymbols;
	var hasOwnProperty = Object.prototype.hasOwnProperty;
	var propIsEnumerable = Object.prototype.propertyIsEnumerable;

	function toObject(val) {
		if (val === null || val === undefined) {
			throw new TypeError('Object.assign cannot be called with null or undefined');
		}

		return Object(val);
	}

	function shouldUseNative() {
		try {
			if (!Object.assign) {
				return false;
			}

			// Detect buggy property enumeration order in older V8 versions.

			// https://bugs.chromium.org/p/v8/issues/detail?id=4118
			var test1 = new String('abc');  // eslint-disable-line no-new-wrappers
			test1[5] = 'de';
			if (Object.getOwnPropertyNames(test1)[0] === '5') {
				return false;
			}

			// https://bugs.chromium.org/p/v8/issues/detail?id=3056
			var test2 = {};
			for (var i = 0; i < 10; i++) {
				test2['_' + String.fromCharCode(i)] = i;
			}
			var order2 = Object.getOwnPropertyNames(test2).map(function (n) {
				return test2[n];
			});
			if (order2.join('') !== '0123456789') {
				return false;
			}

			// https://bugs.chromium.org/p/v8/issues/detail?id=3056
			var test3 = {};
			'abcdefghijklmnopqrst'.split('').forEach(function (letter) {
				test3[letter] = letter;
			});
			if (Object.keys(Object.assign({}, test3)).join('') !==
					'abcdefghijklmnopqrst') {
				return false;
			}

			return true;
		} catch (err) {
			// We don't expect any of the above to throw, but better to be safe.
			return false;
		}
	}

	var objectAssign = shouldUseNative() ? Object.assign : function (target, source) {
		var arguments$1 = arguments;

		var from;
		var to = toObject(target);
		var symbols;

		for (var s = 1; s < arguments.length; s++) {
			from = Object(arguments$1[s]);

			for (var key in from) {
				if (hasOwnProperty.call(from, key)) {
					to[key] = from[key];
				}
			}

			if (getOwnPropertySymbols) {
				symbols = getOwnPropertySymbols(from);
				for (var i = 0; i < symbols.length; i++) {
					if (propIsEnumerable.call(from, symbols[i])) {
						to[symbols[i]] = from[symbols[i]];
					}
				}
			}
		}

		return to;
	};

	// import objectAssign from 'object-assign'

	/**
	 * Transform color object to rgb/a
	 * @param  {Object} colorObj RGB(A) color object
	 * @return {String}       	 rgba css string
	 */

	function toRGBA (colorObj) {
		var c = objectAssign( { a: 1 }, colorObj );	// rgb-to-rgba:  alpha is optionally set to 1
		return ("rgba(" + (c.r) + ", " + (c.g) + ", " + (c.b) + ", " + (c.a) + ")")
	}

	function drawPolygonsOnContext ( ctx, polygons, size, dpr ) {
		dpr = dpr || 1;

		polygons.forEach( function ( polygon, index ) {
			ctx.beginPath();
			ctx.moveTo( polygon.a.x * dpr, polygon.a.y * dpr );
			ctx.lineTo( polygon.b.x * dpr, polygon.b.y * dpr );
			ctx.lineTo( polygon.c.x * dpr, polygon.c.y * dpr );
			ctx.lineTo( polygon.a.x * dpr, polygon.a.y * dpr );
			
			// http://weblogs.asp.net/dwahlin/rendering-linear-gradients-using-the-html5-canvas
			if ( polygon.gradient ) {
				var gradient = ctx.createLinearGradient(
					polygon.gradient.x1 * dpr,
					polygon.gradient.y1 * dpr,
					polygon.gradient.x2 * dpr,
					polygon.gradient.y2 * dpr
				);

				var lastColorIndex = polygon.gradient.colors.length - 1;
				
				polygon.gradient.colors.forEach( function ( color, index ) {
					var rgba = toRGBA( color );
					console.log( color );
					gradient.addColorStop( index / lastColorIndex, rgba );
				} );

				ctx.fillStyle = gradient;
				ctx.fill();

				if ( polygon.strokeWidth > 0 ) {
					ctx.strokeStyle = gradient;
					ctx.lineWidth = polygon.strokeWidth * dpr;
					ctx.lineJoin = polygon.lineJoin;
					ctx.stroke();
				}
			} else {
				if ( polygon.fill ) {
					ctx.fillStyle = toRGBA( polygon.fill );
					ctx.fill();
				}

				if ( polygon.strokeColor ) {
					ctx.strokeStyle = toRGBA( polygon.strokeColor );
					ctx.lineWidth = polygon.strokeWidth * dpr;
					ctx.lineJoin = polygon.lineJoin;
					ctx.stroke();
				}
			}

			ctx.closePath();
		} );

		return ctx;
	}

	function polygonsToImageData ( polygons, size, options ) {
		var dpr = options && options.dpr ? options.dpr : 1;	
		var ctx = makeCanvasAndContext( size, options, dpr, true ).ctx;
		
		drawPolygonsOnContext( ctx, polygons, size, dpr );

		return ctx.getImageData( 0, 0, size.width * dpr, size.height * dpr );
	}

	function polygonsToDataURL ( polygons, size, options ) {
		var dpr = options && options.dpr ? options.dpr : 1;	
		var canvasData = makeCanvasAndContext( size, options, dpr );

		drawPolygonsOnContext( canvasData.ctx, polygons, size, dpr );

		return canvasData.canvas.toDataURL();
	}

	function componentToHex ( c ) {
		var hex = c.toString( 16 );
		return hex.length == 1 ? '0' + hex : hex;
	}

	function toHex ( ref ) {
		var r = ref.r;
		var g = ref.g;
		var b = ref.b;

		return '#' + componentToHex( r ) + componentToHex( g ) + componentToHex( b );
	}

	// http://stackoverflow.com/questions/6918597/convert-canvas-or-control-points-to-svg
	// https://developer.mozilla.org/en-US/docs/SVG/Element/polygon
	function polygonsToSVG ( polygons, size ) {
		var defStr = '';

		if ( polygons.length && polygons[0].gradient ) {
			defStr = '<defs>';
		}

		var polygonStr = '';

		polygons.forEach( function ( polygon, index ) {
			var a = polygon.a;
			var b = polygon.b;
			var c = polygon.c;

			polygonStr += "<polygon points=\"" + (a.x) + "," + (a.y) + " " + (b.x) + "," + (b.y) + " " + (c.x) + "," + (c.y) + "\"";

			if ( polygon.gradient ) {
				var bb = polygon.boundingBox;
				var x1 = ( ( polygon.gradient.x1 - bb.x ) / bb.width * 100 ).toFixed( 3 );
				var y1 = ( ( polygon.gradient.y1 - bb.y ) / bb.height * 100 ).toFixed( 3 );
				var x2 = ( ( polygon.gradient.x2 - bb.x ) / bb.width * 100 ).toFixed( 3 );
				var y2 = ( ( polygon.gradient.y2 - bb.y ) / bb.height * 100 ).toFixed( 3 );

				defStr += "\n\t<linearGradient id=\"gradient-" + index + "\" x1=\"" + x1 + "%\" y1=\"" + y1 + "%\" x2=\"" + x2 + "%\" y2=\"" + y2 + "%\">";

				var lastColorIndex = polygon.gradient.colors.length - 1;
				
				polygon.gradient.colors.forEach( function ( color, index ) {
					var hex = toHex( color );
					var opacityStr = color.a < 1 ? ' stop-opacity="' + color.a + '"' : '';
					var offset = ( ( index / lastColorIndex ) * 100 ).toFixed( 3 );
					defStr += "\n\t\t\t\t\t<stop offset=\"" + offset + "%\" stop-color=\"" + hex + "\"" + opacityStr + "/>\n\t\t\t\t";
				} );
		
				defStr += "</linearGradient>";
				polygonStr += " fill=\"url(#gradient-" + index + ")\"";

				if ( polygon.strokeWidth > 0 ) {
					polygonStr += " stroke=\"url(#gradient-" + index + ")\" stroke-width=\"" + (polygon.strokeWidth) + "\" stroke-linejoin=\"" + (polygon.lineJoin) + "\"";
				}

			} else {
				if ( polygon.fill ) {
					var hexColor = toHex( polygon.fill );
					var opacityStr = polygon.fill.a < 1 ? (" fill-opacity=\"" + (polygon.fill.a) + "\"") : '';
					polygonStr += " fill=\"" + hexColor + "\"" + opacityStr;
				} else {
					polygonStr += " fill=\"transparent\"";
				}

				if ( polygon.strokeColor ) {
					var hexColor$1 = toHex( polygon.strokeColor );
					var opacityStr$1 = polygon.strokeColor.a < 1 ? (" stroke-opacity=\"" + (polygon.strokeColor.a) + "\"") : '';

					polygonStr += " stroke=\"" + hexColor$1 + "\" stroke-width=\"" + (polygon.strokeWidth) + "\" stroke-linejoin=\"" + (polygon.lineJoin) + "\"" + opacityStr$1;
				}
			}


			polygonStr += "/>\n\t";
		} );

		if ( defStr.length ) {
			defStr += "\n\t\t</defs>";
		}

		var svg = "<?xml version=\"1.0\" standalone=\"yes\"?>\n<svg width=\"" + (size.width) + "\" height=\"" + (size.height) + "\" xmlns=\"http://www.w3.org/2000/svg\" version=\"1.1\" >\n\t" + defStr + "\n\t" + polygonStr + "\n</svg>";

		return svg;
	}

	var commonjsGlobal = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

	function commonjsRequire () {
		throw new Error('Dynamic requires are not currently supported by rollup-plugin-commonjs');
	}

	function createCommonjsModule(fn, module) {
		return module = { exports: {} }, fn(module, module.exports), module.exports;
	}

	var delaunay = createCommonjsModule(function (module) {
	function Triangle(a, b, c) {
	  this.a = a;
	  this.b = b;
	  this.c = c;

	  var A = b.x - a.x,
	      B = b.y - a.y,
	      C = c.x - a.x,
	      D = c.y - a.y,
	      E = A * (a.x + b.x) + B * (a.y + b.y),
	      F = C * (a.x + c.x) + D * (a.y + c.y),
	      G = 2 * (A * (c.y - b.y) - B * (c.x - b.x)),
	      minx, miny, dx, dy;

	  /* If the points of the triangle are collinear, then just find the
	   * extremes and use the midpoint as the center of the circumcircle. */
	  if(Math.abs(G) < 0.000001) {
	    minx = Math.min(a.x, b.x, c.x);
	    miny = Math.min(a.y, b.y, c.y);
	    dx   = (Math.max(a.x, b.x, c.x) - minx) * 0.5;
	    dy   = (Math.max(a.y, b.y, c.y) - miny) * 0.5;

	    this.x = minx + dx;
	    this.y = miny + dy;
	    this.r = dx * dx + dy * dy;
	  }

	  else {
	    this.x = (D*E - B*F) / G;
	    this.y = (A*F - C*E) / G;
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
	  return b.x - a.x
	}

	function dedup(edges) {
	  var j = edges.length,
	      a, b, i, m, n;

	  outer: while(j) {
	    b = edges[--j];
	    a = edges[--j];
	    i = j;
	    while(i) {
	      n = edges[--i];
	      m = edges[--i];
	      if((a === m && b === n) || (a === n && b === m)) {
	        edges.splice(j, 2);
	        edges.splice(i, 2);
	        j -= 2;
	        continue outer
	      }
	    }
	  }
	}

	function triangulate(vertices) {
	  /* Bail if there aren't enough vertices to form any triangles. */
	  if(vertices.length < 3)
	    { return [] }

	  /* Ensure the vertex array is in order of descending X coordinate
	   * (which is needed to ensure a subquadratic runtime), and then find
	   * the bounding box around the points. */
	  vertices.sort(byX);

	  var i    = vertices.length - 1,
	      xmin = vertices[i].x,
	      xmax = vertices[0].x,
	      ymin = vertices[i].y,
	      ymax = ymin;

	  while(i--) {
	    if(vertices[i].y < ymin) { ymin = vertices[i].y; }
	    if(vertices[i].y > ymax) { ymax = vertices[i].y; }
	  }

	  /* Find a supertriangle, which is a triangle that surrounds all the
	   * vertices. This is used like something of a sentinel value to remove
	   * cases in the main algorithm, and is removed before we return any
	   * results.
	   *
	   * Once found, put it in the "open" list. (The "open" list is for
	   * triangles who may still need to be considered; the "closed" list is
	   * for triangles which do not.) */
	  var dx     = xmax - xmin,
	      dy     = ymax - ymin,
	      dmax   = (dx > dy) ? dx : dy,
	      xmid   = (xmax + xmin) * 0.5,
	      ymid   = (ymax + ymin) * 0.5,
	      open   = [
	        new Triangle(
	          {x: xmid - 20 * dmax, y: ymid -      dmax, __sentinel: true},
	          {x: xmid            , y: ymid + 20 * dmax, __sentinel: true},
	          {x: xmid + 20 * dmax, y: ymid -      dmax, __sentinel: true}
	        )
	      ],
	      closed = [],
	      edges = [],
	      j, a, b;

	  /* Incrementally add each vertex to the mesh. */
	  i = vertices.length;
	  while(i--) {
	    /* For each open triangle, check to see if the current point is
	     * inside it's circumcircle. If it is, remove the triangle and add
	     * it's edges to an edge list. */
	    edges.length = 0;
	    j = open.length;
	    while(j--) {
	      /* If this point is to the right of this triangle's circumcircle,
	       * then this triangle should never get checked again. Remove it
	       * from the open list, add it to the closed list, and skip. */
	      dx = vertices[i].x - open[j].x;
	      if(dx > 0 && dx * dx > open[j].r) {
	        closed.push(open[j]);
	        open.splice(j, 1);
	        continue
	      }

	      /* If not, skip this triangle. */
	      dy = vertices[i].y - open[j].y;
	      if(dx * dx + dy * dy > open[j].r)
	        { continue }

	      /* Remove the triangle and add it's edges to the edge list. */
	      edges.push(
	        open[j].a, open[j].b,
	        open[j].b, open[j].c,
	        open[j].c, open[j].a
	      );
	      open.splice(j, 1);
	    }

	    /* Remove any doubled edges. */
	    dedup(edges);

	    /* Add a new triangle for each edge. */
	    j = edges.length;
	    while(j) {
	      b = edges[--j];
	      a = edges[--j];
	      open.push(new Triangle(a, b, vertices[i]));
	    }
	  }

	  /* Copy any remaining open triangles to the closed list, and then
	   * remove any triangles that share a vertex with the supertriangle. */
	  Array.prototype.push.apply(closed, open);

	  i = closed.length;
	  while(i--)
	    { if(closed[i].a.__sentinel ||
	       closed[i].b.__sentinel ||
	       closed[i].c.__sentinel)
	      { closed.splice(i, 1); } }

	  /* Yay, we're done! */
	  return closed
	}

	{
	    module.exports = {
	        Triangle: Triangle,
	        triangulate: triangulate
	    };
	}
	});
	var delaunay_1 = delaunay.Triangle;
	var delaunay_2 = delaunay.triangulate;

	var sobel = createCommonjsModule(function (module, exports) {
	(function(root) {

	  function Sobel(imageData) {
	    if (!(this instanceof Sobel)) {
	      return new Sobel(imageData);
	    }

	    var width = imageData.width;
	    var height = imageData.height;

	    var kernelX = [
	      [-1,0,1],
	      [-2,0,2],
	      [-1,0,1]
	    ];

	    var kernelY = [
	      [-1,-2,-1],
	      [0,0,0],
	      [1,2,1]
	    ];

	    var sobelData = [];
	    var grayscaleData = [];

	    function bindPixelAt(data) {
	      return function(x, y, i) {
	        i = i || 0;
	        return data[((width * y) + x) * 4 + i];
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
	        var pixelX = (
	            (kernelX[0][0] * pixelAt(x - 1, y - 1)) +
	            (kernelX[0][1] * pixelAt(x, y - 1)) +
	            (kernelX[0][2] * pixelAt(x + 1, y - 1)) +
	            (kernelX[1][0] * pixelAt(x - 1, y)) +
	            (kernelX[1][1] * pixelAt(x, y)) +
	            (kernelX[1][2] * pixelAt(x + 1, y)) +
	            (kernelX[2][0] * pixelAt(x - 1, y + 1)) +
	            (kernelX[2][1] * pixelAt(x, y + 1)) +
	            (kernelX[2][2] * pixelAt(x + 1, y + 1))
	        );

	        var pixelY = (
	          (kernelY[0][0] * pixelAt(x - 1, y - 1)) +
	          (kernelY[0][1] * pixelAt(x, y - 1)) +
	          (kernelY[0][2] * pixelAt(x + 1, y - 1)) +
	          (kernelY[1][0] * pixelAt(x - 1, y)) +
	          (kernelY[1][1] * pixelAt(x, y)) +
	          (kernelY[1][2] * pixelAt(x + 1, y)) +
	          (kernelY[2][0] * pixelAt(x - 1, y + 1)) +
	          (kernelY[2][1] * pixelAt(x, y + 1)) +
	          (kernelY[2][2] * pixelAt(x + 1, y + 1))
	        );

	        var magnitude = Math.sqrt((pixelX * pixelX) + (pixelY * pixelY))>>>0;

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

	  {
	    if (module.exports) {
	      exports = module.exports = Sobel;
	    }
	    exports.Sobel = Sobel;
	  }

	})(commonjsGlobal);
	});
	var sobel_1 = sobel.Sobel;

	function isImageData (imageData) {
		return (
			imageData && 
			typeof imageData.width === 'number' &&
			typeof imageData.height === 'number' &&
			imageData.data &&
			typeof imageData.data.length === 'number' &&
			typeof imageData.data === 'object'
		);
	}

	function copyImageData (imageData) {
		if ( isImageData ( imageData ) ) {
			if ( typeof Uint8ClampedArray === 'undefined' ) {
				if ( typeof window === 'undefined' ) {
					throw new Error( "Can't copy imageData in webworker without Uint8ClampedArray support." );
					return imageData;
				} else {
					return copyImageDataWithCanvas( imageData );
				}
			} else {
				var clampedArray = new Uint8ClampedArray( imageData.data );

				if ( typeof ImageData === 'undefined' ) {
					// http://stackoverflow.com/a/15238036/229189
					return {
						width: imageData.width,
						height: imageData.height,
						data: clampedArray
					};
				} else {
					// http://stackoverflow.com/a/15908922/229189#comment57192591_15908922
					var result;

					try {
						result = new ImageData( clampedArray, imageData.width, imageData.height );
					} catch ( err ) {
						if ( typeof window === 'undefined' ) {
							throw new Error( "Can't copy imageData in webworker without proper ImageData() support." );
							result = imageData;
						} else {
							result = copyImageDataWithCanvas( imageData );
						}
					}

					return result;
				}
			}
		} else {
			throw new Error( 'Given imageData object is not useable.' );
			return;
		}
	}

	// http://stackoverflow.com/a/11918126/229189
	function copyImageDataWithCanvas ( imageData ) {
		var canvas = new Canvas( imageData.width, imageData.height );
		var ctx = canvas.getContext( '2d' );

		ctx.putImageData( imageData, 0, 0 );
					
		return ctx.getImageData( 0, 0, imageData.width, imageData.height );
	}

	/*
	    StackBlur - a fast almost Gaussian Blur For Canvas

	    Version:     0.5
	    Author:        Mario Klingemann
	    Contact:     mario@quasimondo.com
	    Website:    http://www.quasimondo.com/StackBlurForCanvas
	    Twitter:    @quasimondo

	    In case you find this class useful - especially in commercial projects -
	    I am not totally unhappy for a small donation to my PayPal account
	    mario@quasimondo.de

	    Or support me on flattr:
	    https://flattr.com/thing/72791/StackBlur-a-fast-almost-Gaussian-Blur-Effect-for-CanvasJavascript

	    Copyright (c) 2010 Mario Klingemann

	    Permission is hereby granted, free of charge, to any person
	    obtaining a copy of this software and associated documentation
	    files (the "Software"), to deal in the Software without
	    restriction, including without limitation the rights to use,
	    copy, modify, merge, publish, distribute, sublicense, and/or sell
	    copies of the Software, and to permit persons to whom the
	    Software is furnished to do so, subject to the following
	    conditions:

	    The above copyright notice and this permission notice shall be
	    included in all copies or substantial portions of the Software.

	    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
	    EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
	    OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
	    NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
	    HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
	    WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
	    FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
	    OTHER DEALINGS IN THE SOFTWARE.
	    */

	var mul_table = [
	    512,512,456,512,328,456,335,512,405,328,271,456,388,335,292,512,
	    454,405,364,328,298,271,496,456,420,388,360,335,312,292,273,512,
	    482,454,428,405,383,364,345,328,312,298,284,271,259,496,475,456,
	    437,420,404,388,374,360,347,335,323,312,302,292,282,273,265,512,
	    497,482,468,454,441,428,417,405,394,383,373,364,354,345,337,328,
	    320,312,305,298,291,284,278,271,265,259,507,496,485,475,465,456,
	    446,437,428,420,412,404,396,388,381,374,367,360,354,347,341,335,
	    329,323,318,312,307,302,297,292,287,282,278,273,269,265,261,512,
	    505,497,489,482,475,468,461,454,447,441,435,428,422,417,411,405,
	    399,394,389,383,378,373,368,364,359,354,350,345,341,337,332,328,
	    324,320,316,312,309,305,301,298,294,291,287,284,281,278,274,271,
	    268,265,262,259,257,507,501,496,491,485,480,475,470,465,460,456,
	    451,446,442,437,433,428,424,420,416,412,408,404,400,396,392,388,
	    385,381,377,374,370,367,363,360,357,354,350,347,344,341,338,335,
	    332,329,326,323,320,318,315,312,310,307,304,302,299,297,294,292,
	    289,287,285,282,280,278,275,273,271,269,267,265,263,261,259];


	var shg_table = [
	    9, 11, 12, 13, 13, 14, 14, 15, 15, 15, 15, 16, 16, 16, 16, 17,
	    17, 17, 17, 17, 17, 17, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19,
	    19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 20, 20, 20,
	    20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 21,
	    21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21,
	    21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 22, 22, 22, 22, 22, 22,
	    22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22,
	    22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 23,
	    23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23,
	    23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23,
	    23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23,
	    23, 23, 23, 23, 23, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24,
	    24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24,
	    24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24,
	    24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24,
	    24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24 ];

	function BlurStack () {
		this.r = 0;
		this.g = 0;
		this.b = 0;
		this.a = 0;
		this.next = null;
	}

	function stackblur ( imageData, top_x, top_y, width, height, radius ) {
		var pixels = imageData.data;

		var x, y, i, p, yp, yi, yw, r_sum, g_sum, b_sum, a_sum,
			r_out_sum, g_out_sum, b_out_sum, a_out_sum,
			r_in_sum, g_in_sum, b_in_sum, a_in_sum,
			pr, pg, pb, pa, rbs;

		var div = radius + radius + 1;
		var widthMinus1  = width - 1;
		var heightMinus1 = height - 1;
		var radiusPlus1  = radius + 1;
		var sumFactor = radiusPlus1 * ( radiusPlus1 + 1 ) / 2;

		var stackStart = new BlurStack();
		var stack = stackStart;
		
		for ( i = 1; i < div; i++ ) {
			stack = stack.next = new BlurStack();
			if (i == radiusPlus1) { var stackEnd = stack; }
		}
		stack.next = stackStart;
		
		var stackIn = null;
		var stackOut = null;

		yw = yi = 0;

		var mul_sum = mul_table[radius];
		var shg_sum = shg_table[radius];

		for ( y = 0; y < height; y++ ) {
			r_in_sum = g_in_sum = b_in_sum = a_in_sum = r_sum = g_sum = b_sum = a_sum = 0;

			r_out_sum = radiusPlus1 * ( pr = pixels[yi] );
			g_out_sum = radiusPlus1 * ( pg = pixels[yi+1] );
			b_out_sum = radiusPlus1 * ( pb = pixels[yi+2] );
			a_out_sum = radiusPlus1 * ( pa = pixels[yi+3] );

			r_sum += sumFactor * pr;
			g_sum += sumFactor * pg;
			b_sum += sumFactor * pb;
			a_sum += sumFactor * pa;

			stack = stackStart;

			for ( i = 0; i < radiusPlus1; i++ ) {
				stack.r = pr;
				stack.g = pg;
				stack.b = pb;
				stack.a = pa;
				stack = stack.next;
			}

			for ( i = 1; i < radiusPlus1; i++ ) {
				p = yi + ( ( widthMinus1 < i ? widthMinus1 : i ) << 2 );
				r_sum += ( stack.r = ( pr = pixels[p] ) ) * ( rbs = radiusPlus1 - i );
				g_sum += ( stack.g = ( pg = pixels[p+1] ) ) * rbs;
				b_sum += ( stack.b = ( pb = pixels[p+2] ) ) * rbs;
				a_sum += ( stack.a = ( pa = pixels[p+3] ) ) * rbs;

				r_in_sum += pr;
				g_in_sum += pg;
				b_in_sum += pb;
				a_in_sum += pa;

				stack = stack.next;
			}


			stackIn = stackStart;
			stackOut = stackEnd;

			for (x = 0; x < width; x++) {
				pixels[yi+3] = pa = (a_sum * mul_sum) >> shg_sum;
				
				if (pa != 0) {
					pa = 255 / pa;
					pixels[yi]   = ( ( r_sum * mul_sum ) >> shg_sum ) * pa;
					pixels[yi+1] = ( ( g_sum * mul_sum ) >> shg_sum ) * pa;
					pixels[yi+2] = ( ( b_sum * mul_sum ) >> shg_sum ) * pa;
				} else {
					pixels[yi] = pixels[yi+1] = pixels[yi+2] = 0;
				}

				r_sum -= r_out_sum;
				g_sum -= g_out_sum;
				b_sum -= b_out_sum;
				a_sum -= a_out_sum;

				r_out_sum -= stackIn.r;
				g_out_sum -= stackIn.g;
				b_out_sum -= stackIn.b;
				a_out_sum -= stackIn.a;

				p =  ( yw + ( ( p = x + radius + 1 ) < widthMinus1 ? p : widthMinus1 ) ) << 2;

				r_in_sum += ( stackIn.r = pixels[p] );
				g_in_sum += ( stackIn.g = pixels[p+1] );
				b_in_sum += ( stackIn.b = pixels[p+2] );
				a_in_sum += ( stackIn.a = pixels[p+3] );

				r_sum += r_in_sum;
				g_sum += g_in_sum;
				b_sum += b_in_sum;
				a_sum += a_in_sum;

				stackIn = stackIn.next;

				r_out_sum += ( pr = stackOut.r );
				g_out_sum += ( pg = stackOut.g );
				b_out_sum += ( pb = stackOut.b );
				a_out_sum += ( pa = stackOut.a );

				r_in_sum -= pr;
				g_in_sum -= pg;
				b_in_sum -= pb;
				a_in_sum -= pa;

				stackOut = stackOut.next;

				yi += 4;
			}
			yw += width;
		}


		for ( x = 0; x < width; x++ ) {
			g_in_sum = b_in_sum = a_in_sum = r_in_sum = g_sum = b_sum = a_sum = r_sum = 0;

			yi = x << 2;
			r_out_sum = radiusPlus1 * ( pr = pixels[yi] );
			g_out_sum = radiusPlus1 * ( pg = pixels[yi+1] );
			b_out_sum = radiusPlus1 * ( pb = pixels[yi+2] );
			a_out_sum = radiusPlus1 * ( pa = pixels[yi+3] );

			r_sum += sumFactor * pr;
			g_sum += sumFactor * pg;
			b_sum += sumFactor * pb;
			a_sum += sumFactor * pa;

			stack = stackStart;

			for ( i = 0; i < radiusPlus1; i++) {
				stack.r = pr;
				stack.g = pg;
				stack.b = pb;
				stack.a = pa;
				stack = stack.next;
			}

			yp = width;

			for ( i = 1; i <= radius; i++ ) {
				yi = ( yp + x ) << 2;

				r_sum += ( stack.r = ( pr = pixels[yi] ) ) * (rbs = radiusPlus1 - i);
				g_sum += ( stack.g = ( pg = pixels[yi+1] ) ) * rbs;
				b_sum += ( stack.b = ( pb = pixels[yi+2] ) ) * rbs;
				a_sum += ( stack.a = ( pa = pixels[yi+3] ) ) * rbs;

				r_in_sum += pr;
				g_in_sum += pg;
				b_in_sum += pb;
				a_in_sum += pa;

				stack = stack.next;

				if ( i < heightMinus1 ) {
					yp += width;
				}
			}

			yi = x;
			stackIn = stackStart;
			stackOut = stackEnd;

			for ( y = 0; y < height; y++ ) {
				p = yi << 2;
				pixels[p+3] = pa = ( a_sum * mul_sum ) >> shg_sum;
				
				if ( pa > 0 ) {
					pa = 255 / pa;
					pixels[p]   = ( ( r_sum * mul_sum ) >> shg_sum) * pa;
					pixels[p+1] = ( ( g_sum * mul_sum ) >> shg_sum) * pa;
					pixels[p+2] = ( ( b_sum * mul_sum ) >> shg_sum) * pa;
				} else {
					pixels[p] = pixels[p+1] = pixels[p+2] = 0;
				}

				r_sum -= r_out_sum;
				g_sum -= g_out_sum;
				b_sum -= b_out_sum;
				a_sum -= a_out_sum;

				r_out_sum -= stackIn.r;
				g_out_sum -= stackIn.g;
				b_out_sum -= stackIn.b;
				a_out_sum -= stackIn.a;

				p = ( x + ( ( ( p = y + radiusPlus1 ) < heightMinus1 ? p : heightMinus1 ) * width ) ) << 2;

				r_sum += ( r_in_sum += ( stackIn.r = pixels[p] ) );
				g_sum += ( g_in_sum += ( stackIn.g = pixels[p+1] ) );
				b_sum += ( b_in_sum += ( stackIn.b = pixels[p+2] ) );
				a_sum += ( a_in_sum += ( stackIn.a = pixels[p+3] ) );

				stackIn = stackIn.next;

				r_out_sum += ( pr = stackOut.r );
				g_out_sum += ( pg = stackOut.g );
				b_out_sum += ( pb = stackOut.b );
				a_out_sum += ( pa = stackOut.a );

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

	function greyscale (imageData) {
		var len = imageData.data.length;
		var brightness;

		for ( var i = 0; i < len; i += 4 ) {
			brightness = 0.34 * imageData.data[i] + 0.5 * imageData.data[i + 1] + 0.16 * imageData.data[i + 2];

			imageData.data[i] = brightness;
			imageData.data[i + 1] = brightness;
			imageData.data[i + 2] = brightness;
		}
			
		return imageData;
	}

	// most parts taken from http://jsdo.it/akm2/xoYx
	// (starting line 293++)
	function getEdgePoints ( imageData, threshold ) {
		// only check every 2nd pixel in imageData to save some time.
		var multiplier = 2;
		var width = imageData.width;
		var height = imageData.height;
		var data = imageData.data;
		var points = [ ];
		var x, y, row, col, sx, sy, step, sum, total;

		for ( y = 0; y < height; y += multiplier ) {
			for ( x = 0; x < width; x += multiplier ) {
				sum = total = 0;

				for ( row = -1; row <= 1; row++ ) {
					sy = y + row;
					step = sy * width;

					if ( sy >= 0 && sy < height ) {
						for ( col = -1; col <= 1; col++ ) {
							sx = x + col;

							if ( sx >= 0 && sx < width ) {
								sum += data[( sx + step ) << 2];
								total++;
							}
						}
					}
				}

				if ( total ) {
					sum /= total;
				}

				if ( sum > threshold ) {
					points.push( { x: x, y: y } );
				}
			}
		}

		return points;
	}

	function addVertex ( x, y, hash ) {
		var resultKey = x + '|' + y;

		if ( ! hash[resultKey] ) {
			hash[resultKey] = { x: x, y: y };
		}

		resultKey = null;
	}

	function getVerticesFromPoints ( points, maxPointCount, accuracy, width, height ) {
		// using hash for all points to make sure we have a set of unique vertices.
		var resultHash = { };

		// use 25% of max point count to create a background grid.
		// this avoids having too many "big" triangles in areas of the image with low contrast 
		// next to very small ones in areas with high contrast
		// for every other row, start the x value at > 0, so the grid doesn't look too regular
		var gridPointCount = Math.max( ~~( maxPointCount * ( 1 - accuracy ) ), 5 );

		// http://stackoverflow.com/a/4107092/229189
		var gridColumns = Math.round( Math.sqrt( gridPointCount ) );
		var gridRows = Math.round( Math.ceil( gridPointCount / gridColumns ) );
		
		var xIncrement = ~~( width / gridColumns );
		var yIncrement = ~~( height / gridRows );

		var rowIndex = 0;
		var startX = 0;

		var x = 0;
		var y = 0;

		for ( y = 0; y < height; y+= yIncrement ) {
			rowIndex++;

			startX = rowIndex % 2 === 0 ? ~~( xIncrement / 2 ) : 0; 

			for ( x = startX; x < width; x += xIncrement ) {
				if ( x < width && y < height ) {
					// "distorting" the grid a little bit so that the
					// background vertices don't appear to be on a straight line (which looks boring)
					addVertex(
						~~( x + ( Math.cos( y ) * ( yIncrement ) ) ),
						~~( y + ( Math.sin( x ) * ( xIncrement ) ) ),
						resultHash
					);
				}
			}
		}
		
		// add points in the corners
		addVertex( 0, 0, resultHash );
		addVertex( width - 1, 0, resultHash );
		addVertex( width - 1, height - 1, resultHash );
		addVertex( 0, height - 1, resultHash );

		// add points from all edge points
		var remainingPointCount = maxPointCount - Object.keys( resultHash ).length;
		var edgePointCount = points.length;
		var increment = ~~( edgePointCount / remainingPointCount );

		if ( maxPointCount > 0 && increment > 0 ) {
			var i = 0;

			for ( i = 0; i < edgePointCount; i += increment ) {
				addVertex( points[i].x, points[i].y, resultHash );
			}
		}

		points = null;

		return Object.keys( resultHash ).map( function (key) {
			return resultHash[key];
		} );
	}

	function getBoundingBox (points) {
		var xMin = Infinity;
		var xMax = -Infinity;
		var yMin = Infinity;
		var yMax = -Infinity;

		points.forEach( function (p) {
			if ( p.x < xMin ) {
				xMin = p.x;
			}

			if ( p.y < yMin ) {
				yMin = p.y;
			}

			if ( p.x > xMax ) {
				xMax = p.x;
			}

			if ( p.y > yMax ) {
				yMax = p.y;
			}
		} );

		return {
			x: xMin,
			y: yMin,
			width: xMax - xMin,
			height: yMax - yMin
		};
	}

	function addBoundingBoxesToPolygons ( polygons, colorData, params ) {
		polygons.forEach( function (polygon) {
			polygon.boundingBox = getBoundingBox( [ polygon.a, polygon.b, polygon.c ] );
		} );

		return polygons.filter( function (polygon) {
			return polygon.boundingBox.width > 0 && polygon.boundingBox.height > 0;
		} );
	}

	/**
	 * Get color object by position
	 * @param  {Object} pos         {x,y} object
	 * @param  {Object} colorData   Image color data object
	 * @param  {Object} [transparentColor] (optional) RGBA color object. Used to set specific color to transparent pixels
	 * @return {Object}             RGBA color object
	 */
	function getColorByPos ( pos, colorData, transparentColor ) {
		var x = clamp( pos.x, 1, colorData.width - 2 );
		var y = clamp( pos.y, 1, colorData.height - 2 );
		var index = ( ( x | 0 ) + ( y | 0 ) * colorData.width ) << 2;

		if ( index >= colorData.data.length ) {
			index = colorData.data.length - 5;
		}

		var alpha = colorData.data[index + 3] / 255;

		// Return RGBA color object
		return ( transparentColor && alpha === 0 ) ? transparentColor : {
			r: colorData.data[index],
			g: colorData.data[index + 1],
			b: colorData.data[index + 2],
			a: alpha
		};
	}

	/**
	 * Get polygon's center point
	 * @param  {Object} polygon Polygon object
	 * @return {Object}         Point coordinates {x,y}
	 */
	function polygonCenter (polygon) {
		return {
			x: ( polygon.a.x + polygon.b.x + polygon.c.x ) * 0.33333,
			y: ( polygon.a.y + polygon.b.y + polygon.c.y ) * 0.33333
		};
	}

	/**
	 * Is color transparent ?
	 * @param  {Object} color Color object
	 * @return {Boolean}      Is transparent?
	 */
	function isTransparent (color) {
		return color.a === 0;
	}

	// https://gist.githubusercontent.com/oriadam/396a4beaaad465ca921618f2f2444d49/raw/76b0de6caffaac59f8af2b4dfa0e0b6397cf447d/colorValues.js
	// return array of [r,g,b,a] from any valid color. if failed returns undefined
	function strToColorArr ( color ) {
		if ( typeof color === 'string' ) {
			var result = [ 0, 0, 0, 0 ];
			
			if ( color[0] === '#' )	{
				// convert #RGB and #RGBA to #RRGGBB and #RRGGBBAA
				if ( color.length < 7 ) {
					color = "#" + (color[1]) + (color[1]) + (color[2]) + (color[2]) + (color[3]) + (color[3]) + (color.length > 4 ? color[4] + color[4] : '');
				}

				result = [
					parseInt(color.substr( 1, 2 ), 16),
					parseInt(color.substr( 3, 2 ), 16),
					parseInt(color.substr( 5, 2 ), 16),
					color.length > 7 ? parseInt( color.substr( 7, 2 ), 16 ) / 255 : 1
				];
			}

			if ( color.indexOf('rgb') === 0 ) {
				// convert 'rgb(R,G,B)' to 'rgb(R,G,B)A' which looks awful but will pass the regxep below
				if ( ! color.includes( 'rgba' ) ) {
					color += ',1';
				}

				result = color
					.match( /[\.\d]+/g )
					.map( function (a) { return +a; } );
			}
			
			return result;
		} else {
			return;
		}

	}

	function strToColor ( str ) {
		var color = strToColorArr( str );

		if ( color ) {
			var r = color[0];
			var g = color[1];
			var b = color[2];
			var a = color[3];
			return { r: r, g: g, b: b, a: a };
		} else {
			return;
		}
	}

	function addColorToPolygons ( polygons, colorData, params ) {
		var fill = params.fill;
		var stroke = params.stroke;
		var strokeWidth = params.strokeWidth;
		var lineJoin = params.lineJoin;
		var transparentColor = params.transparentColor;
		var fillColor = fill ? strToColor( fill ) : false;
		var strokeColor = stroke ? strToColor( stroke ) : false;

		/**
		 * Color override logic
		 * @param  {Object} color    Color object
		 * @param  {String} override Override color (fillColor/strokeColor)
		 * @return {String}          CSS formatted color (rgba,..)
		 */
		var getColor = function ( color, override ) {
			var t = ( isTransparent( color ) && transparentColor );	// Color is transparent, and transparentColor override is defined
			var c = t ? transparentColor : color;
			return ( override && !t ) ? override : c;		// Priority: transparentColor -> override -> supplied color
		};

		polygons.forEach( function (polygon) {
			var color = getColorByPos( polygonCenter( polygon ), colorData );

			if ( fill ) {
				polygon.fill = getColor( color, fillColor );
			}

			if ( stroke ) {
				polygon.strokeColor = getColor(color, strokeColor);
				polygon.strokeWidth = strokeWidth;
				polygon.lineJoin = lineJoin;
			}
		} );

		return polygons;
	}

	//  http://stackoverflow.com/a/9733420/229189
	function luminance (color) {
		var a = [ color.r, color.g, color.b ].map( function (v) {
			v /= 255;
			return ( v <= 0.03928 ) ? v / 12.92 : Math.pow( ( ( v + 0.055 ) / 1.055 ), 2.4 );
		} );

		return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
	}

	function distance ( a, b ) {
		var dx = b.x - a.x;
		var dy = b.y - a.y;

		return Math.sqrt( ( dx * dx ) + ( dy * dy ) );
	}

	function addGradientsToPolygons ( polygons, colorData, params ) {
		polygons.forEach( function (polygon) {
			var data = { };

			'abc'.split( '' ).forEach( function (key) {
				var color = getColorByPos( polygon[key], colorData, params.transparentColor );
				
				data[key] = {
					key: key,
					color: color,
					x: polygon[key].x,
					y: polygon[key].y
				};

				data[key].luminance = luminance( data[key].color );

				var otherKeys = 'abc'.replace( key, '' ).split( '' );

				data[key].median = {
					x: ( polygon[otherKeys[0]].x + polygon[otherKeys[1]].x ) / 2,
					y: ( polygon[otherKeys[0]].y + polygon[otherKeys[1]].y ) / 2
				};

				data[key].medianColor = getColorByPos( data[key].median, colorData, params.transparentColor );
				data[key].medianLuminance = luminance( data[key].medianColor );
			} );

			// sort by axis of most difference in luminance
			var pointsByDeltaInLuminance = [ data.a, data.b, data.c ].sort( function ( u, v ) {
				return Math.abs( u.luminance - u.medianLuminance ) - Math.abs( v.luminance - v.medianLuminance );
			} );

			var pointWithMostDeltaInLuminance = pointsByDeltaInLuminance[0];
			var startPoint = pointsByDeltaInLuminance[0];
			var endPoint = pointWithMostDeltaInLuminance.median;

			var gradienStopPositions = [ startPoint ];

			var startToEndDistance = distance( startPoint, endPoint );

			for ( var i = 1, len = params.gradientStops - 2; i < len; i++ ) {
				var pointDistance = i * ( startToEndDistance / params.gradientStops );
				var pointPercent = pointDistance / startToEndDistance;
				
				var point = {
					x: startPoint.x + pointPercent * ( endPoint.x - startPoint.x ), 
					y: startPoint.y + pointPercent * ( endPoint.y - startPoint.y )
				};

				gradienStopPositions.push( point );
			}

			gradienStopPositions.push( endPoint );

			polygon.gradient = {
				x1: pointWithMostDeltaInLuminance.x,
				y1: pointWithMostDeltaInLuminance.y,
				x2: pointWithMostDeltaInLuminance.median.x,
				y2: pointWithMostDeltaInLuminance.median.y,
				colors: gradienStopPositions.map( function (pos) {
					return getColorByPos( pos, colorData, params.transparentColor );
				} )
			};

			if ( params.stroke ) {
				polygon.strokeWidth = params.strokeWidth;
				polygon.lineJoin = params.lineJoin;
			}

			data = null;
		} );

		return polygons;
	}

	/**
	 * Filter polygons with transparent color
	 * @param  {Array} polygons    Polygons array
	 * @param  {Object} colorData  Color data
	 * @return {Array}             Filtered polygons array
	 */
	function filterTransparentPolygons ( polygons, colorData ) {
		return polygons.filter( function (polygon) {
			var color = getColorByPos( polygonCenter( polygon ), colorData );
			return ! isTransparent( color );
		});
	}

	function imageDataToPolygons ( imageData, params ) {
		if ( isImageData( imageData ) ) {
			var imageSize = { width: imageData.width, height: imageData.height };
			var tmpImageData = copyImageData( imageData );
			var colorImageData = copyImageData( imageData );
			var blurredImageData = stackblur( tmpImageData, 0, 0, imageSize.width, imageSize.height, params.blur );
			var greyscaleImageData = greyscale( blurredImageData );
			var edgesImageData = sobel( greyscaleImageData ).toImageData();
			var edgePoints = getEdgePoints( edgesImageData, params.threshold );
			var edgeVertices = getVerticesFromPoints( edgePoints, params.vertexCount, params.accuracy, imageSize.width, imageSize.height );
			var polygons = delaunay_2( edgeVertices );
			
			polygons = addBoundingBoxesToPolygons( polygons );
			
			if ( ! params.transparentColor ) {
				polygons = filterTransparentPolygons( polygons, colorImageData );
			}
			
			if ( params.fill === true && params.gradients === true ) {
				polygons = addGradientsToPolygons( polygons, colorImageData, params );
			} else {
				polygons = addColorToPolygons( polygons, colorImageData, params );
			}

			return polygons;
		} else {
			throw new Error( "Can't work with the imageData provided. It seems to be corrupt." );
			return;
		}
	}

	var es6Promise = createCommonjsModule(function (module, exports) {
	/*!
	 * @overview es6-promise - a tiny implementation of Promises/A+.
	 * @copyright Copyright (c) 2014 Yehuda Katz, Tom Dale, Stefan Penner and contributors (Conversion to ES6 API by Jake Archibald)
	 * @license   Licensed under MIT license
	 *            See https://raw.githubusercontent.com/stefanpenner/es6-promise/master/LICENSE
	 * @version   4.1.0
	 */

	(function (global, factory) {
	    module.exports = factory();
	}(commonjsGlobal, (function () {
	function objectOrFunction(x) {
	  return typeof x === 'function' || typeof x === 'object' && x !== null;
	}

	function isFunction(x) {
	  return typeof x === 'function';
	}

	var _isArray = undefined;
	if (!Array.isArray) {
	  _isArray = function (x) {
	    return Object.prototype.toString.call(x) === '[object Array]';
	  };
	} else {
	  _isArray = Array.isArray;
	}

	var isArray = _isArray;

	var len = 0;
	var vertxNext = undefined;
	var customSchedulerFn = undefined;

	var asap = function asap(callback, arg) {
	  queue[len] = callback;
	  queue[len + 1] = arg;
	  len += 2;
	  if (len === 2) {
	    // If len is 2, that means that we need to schedule an async flush.
	    // If additional callbacks are queued before the queue is flushed, they
	    // will be processed by this flush that we are scheduling.
	    if (customSchedulerFn) {
	      customSchedulerFn(flush);
	    } else {
	      scheduleFlush();
	    }
	  }
	};

	function setScheduler(scheduleFn) {
	  customSchedulerFn = scheduleFn;
	}

	function setAsap(asapFn) {
	  asap = asapFn;
	}

	var browserWindow = typeof window !== 'undefined' ? window : undefined;
	var browserGlobal = browserWindow || {};
	var BrowserMutationObserver = browserGlobal.MutationObserver || browserGlobal.WebKitMutationObserver;
	var isNode = typeof self === 'undefined' && typeof process !== 'undefined' && ({}).toString.call(process) === '[object process]';

	// test for web worker but not in IE10
	var isWorker = typeof Uint8ClampedArray !== 'undefined' && typeof importScripts !== 'undefined' && typeof MessageChannel !== 'undefined';

	// node
	function useNextTick() {
	  // node version 0.10.x displays a deprecation warning when nextTick is used recursively
	  // see https://github.com/cujojs/when/issues/410 for details
	  return function () {
	    return process.nextTick(flush);
	  };
	}

	// vertx
	function useVertxTimer() {
	  if (typeof vertxNext !== 'undefined') {
	    return function () {
	      vertxNext(flush);
	    };
	  }

	  return useSetTimeout();
	}

	function useMutationObserver() {
	  var iterations = 0;
	  var observer = new BrowserMutationObserver(flush);
	  var node = document.createTextNode('');
	  observer.observe(node, { characterData: true });

	  return function () {
	    node.data = iterations = ++iterations % 2;
	  };
	}

	// web worker
	function useMessageChannel() {
	  var channel = new MessageChannel();
	  channel.port1.onmessage = flush;
	  return function () {
	    return channel.port2.postMessage(0);
	  };
	}

	function useSetTimeout() {
	  // Store setTimeout reference so es6-promise will be unaffected by
	  // other code modifying setTimeout (like sinon.useFakeTimers())
	  var globalSetTimeout = setTimeout;
	  return function () {
	    return globalSetTimeout(flush, 1);
	  };
	}

	var queue = new Array(1000);
	function flush() {
	  for (var i = 0; i < len; i += 2) {
	    var callback = queue[i];
	    var arg = queue[i + 1];

	    callback(arg);

	    queue[i] = undefined;
	    queue[i + 1] = undefined;
	  }

	  len = 0;
	}

	function attemptVertx() {
	  try {
	    var r = commonjsRequire;
	    var vertx = r('vertx');
	    vertxNext = vertx.runOnLoop || vertx.runOnContext;
	    return useVertxTimer();
	  } catch (e) {
	    return useSetTimeout();
	  }
	}

	var scheduleFlush = undefined;
	// Decide what async method to use to triggering processing of queued callbacks:
	if (isNode) {
	  scheduleFlush = useNextTick();
	} else if (BrowserMutationObserver) {
	  scheduleFlush = useMutationObserver();
	} else if (isWorker) {
	  scheduleFlush = useMessageChannel();
	} else if (browserWindow === undefined && typeof commonjsRequire === 'function') {
	  scheduleFlush = attemptVertx();
	} else {
	  scheduleFlush = useSetTimeout();
	}

	function then(onFulfillment, onRejection) {
	  var _arguments = arguments;

	  var parent = this;

	  var child = new this.constructor(noop);

	  if (child[PROMISE_ID] === undefined) {
	    makePromise(child);
	  }

	  var _state = parent._state;

	  if (_state) {
	    (function () {
	      var callback = _arguments[_state - 1];
	      asap(function () {
	        return invokeCallback(_state, child, callback, parent._result);
	      });
	    })();
	  } else {
	    subscribe(parent, child, onFulfillment, onRejection);
	  }

	  return child;
	}

	/**
	  `Promise.resolve` returns a promise that will become resolved with the
	  passed `value`. It is shorthand for the following:

	  ```javascript
	  let promise = new Promise(function(resolve, reject){
	    resolve(1);
	  });

	  promise.then(function(value){
	    // value === 1
	  });
	  ```

	  Instead of writing the above, your code now simply becomes the following:

	  ```javascript
	  let promise = Promise.resolve(1);

	  promise.then(function(value){
	    // value === 1
	  });
	  ```

	  @method resolve
	  @static
	  @param {Any} value value that the returned promise will be resolved with
	  Useful for tooling.
	  @return {Promise} a promise that will become fulfilled with the given
	  `value`
	*/
	function resolve(object) {
	  /*jshint validthis:true */
	  var Constructor = this;

	  if (object && typeof object === 'object' && object.constructor === Constructor) {
	    return object;
	  }

	  var promise = new Constructor(noop);
	  _resolve(promise, object);
	  return promise;
	}

	var PROMISE_ID = Math.random().toString(36).substring(16);

	function noop() {}

	var PENDING = void 0;
	var FULFILLED = 1;
	var REJECTED = 2;

	var GET_THEN_ERROR = new ErrorObject();

	function selfFulfillment() {
	  return new TypeError("You cannot resolve a promise with itself");
	}

	function cannotReturnOwn() {
	  return new TypeError('A promises callback cannot return that same promise.');
	}

	function getThen(promise) {
	  try {
	    return promise.then;
	  } catch (error) {
	    GET_THEN_ERROR.error = error;
	    return GET_THEN_ERROR;
	  }
	}

	function tryThen(then, value, fulfillmentHandler, rejectionHandler) {
	  try {
	    then.call(value, fulfillmentHandler, rejectionHandler);
	  } catch (e) {
	    return e;
	  }
	}

	function handleForeignThenable(promise, thenable, then) {
	  asap(function (promise) {
	    var sealed = false;
	    var error = tryThen(then, thenable, function (value) {
	      if (sealed) {
	        return;
	      }
	      sealed = true;
	      if (thenable !== value) {
	        _resolve(promise, value);
	      } else {
	        fulfill(promise, value);
	      }
	    }, function (reason) {
	      if (sealed) {
	        return;
	      }
	      sealed = true;

	      _reject(promise, reason);
	    }, 'Settle: ' + (promise._label || ' unknown promise'));

	    if (!sealed && error) {
	      sealed = true;
	      _reject(promise, error);
	    }
	  }, promise);
	}

	function handleOwnThenable(promise, thenable) {
	  if (thenable._state === FULFILLED) {
	    fulfill(promise, thenable._result);
	  } else if (thenable._state === REJECTED) {
	    _reject(promise, thenable._result);
	  } else {
	    subscribe(thenable, undefined, function (value) {
	      return _resolve(promise, value);
	    }, function (reason) {
	      return _reject(promise, reason);
	    });
	  }
	}

	function handleMaybeThenable(promise, maybeThenable, then$$) {
	  if (maybeThenable.constructor === promise.constructor && then$$ === then && maybeThenable.constructor.resolve === resolve) {
	    handleOwnThenable(promise, maybeThenable);
	  } else {
	    if (then$$ === GET_THEN_ERROR) {
	      _reject(promise, GET_THEN_ERROR.error);
	      GET_THEN_ERROR.error = null;
	    } else if (then$$ === undefined) {
	      fulfill(promise, maybeThenable);
	    } else if (isFunction(then$$)) {
	      handleForeignThenable(promise, maybeThenable, then$$);
	    } else {
	      fulfill(promise, maybeThenable);
	    }
	  }
	}

	function _resolve(promise, value) {
	  if (promise === value) {
	    _reject(promise, selfFulfillment());
	  } else if (objectOrFunction(value)) {
	    handleMaybeThenable(promise, value, getThen(value));
	  } else {
	    fulfill(promise, value);
	  }
	}

	function publishRejection(promise) {
	  if (promise._onerror) {
	    promise._onerror(promise._result);
	  }

	  publish(promise);
	}

	function fulfill(promise, value) {
	  if (promise._state !== PENDING) {
	    return;
	  }

	  promise._result = value;
	  promise._state = FULFILLED;

	  if (promise._subscribers.length !== 0) {
	    asap(publish, promise);
	  }
	}

	function _reject(promise, reason) {
	  if (promise._state !== PENDING) {
	    return;
	  }
	  promise._state = REJECTED;
	  promise._result = reason;

	  asap(publishRejection, promise);
	}

	function subscribe(parent, child, onFulfillment, onRejection) {
	  var _subscribers = parent._subscribers;
	  var length = _subscribers.length;

	  parent._onerror = null;

	  _subscribers[length] = child;
	  _subscribers[length + FULFILLED] = onFulfillment;
	  _subscribers[length + REJECTED] = onRejection;

	  if (length === 0 && parent._state) {
	    asap(publish, parent);
	  }
	}

	function publish(promise) {
	  var subscribers = promise._subscribers;
	  var settled = promise._state;

	  if (subscribers.length === 0) {
	    return;
	  }

	  var child = undefined,
	      callback = undefined,
	      detail = promise._result;

	  for (var i = 0; i < subscribers.length; i += 3) {
	    child = subscribers[i];
	    callback = subscribers[i + settled];

	    if (child) {
	      invokeCallback(settled, child, callback, detail);
	    } else {
	      callback(detail);
	    }
	  }

	  promise._subscribers.length = 0;
	}

	function ErrorObject() {
	  this.error = null;
	}

	var TRY_CATCH_ERROR = new ErrorObject();

	function tryCatch(callback, detail) {
	  try {
	    return callback(detail);
	  } catch (e) {
	    TRY_CATCH_ERROR.error = e;
	    return TRY_CATCH_ERROR;
	  }
	}

	function invokeCallback(settled, promise, callback, detail) {
	  var hasCallback = isFunction(callback),
	      value = undefined,
	      error = undefined,
	      succeeded = undefined,
	      failed = undefined;

	  if (hasCallback) {
	    value = tryCatch(callback, detail);

	    if (value === TRY_CATCH_ERROR) {
	      failed = true;
	      error = value.error;
	      value.error = null;
	    } else {
	      succeeded = true;
	    }

	    if (promise === value) {
	      _reject(promise, cannotReturnOwn());
	      return;
	    }
	  } else {
	    value = detail;
	    succeeded = true;
	  }

	  if (promise._state !== PENDING) ; else if (hasCallback && succeeded) {
	      _resolve(promise, value);
	    } else if (failed) {
	      _reject(promise, error);
	    } else if (settled === FULFILLED) {
	      fulfill(promise, value);
	    } else if (settled === REJECTED) {
	      _reject(promise, value);
	    }
	}

	function initializePromise(promise, resolver) {
	  try {
	    resolver(function resolvePromise(value) {
	      _resolve(promise, value);
	    }, function rejectPromise(reason) {
	      _reject(promise, reason);
	    });
	  } catch (e) {
	    _reject(promise, e);
	  }
	}

	var id = 0;
	function nextId() {
	  return id++;
	}

	function makePromise(promise) {
	  promise[PROMISE_ID] = id++;
	  promise._state = undefined;
	  promise._result = undefined;
	  promise._subscribers = [];
	}

	function Enumerator(Constructor, input) {
	  this._instanceConstructor = Constructor;
	  this.promise = new Constructor(noop);

	  if (!this.promise[PROMISE_ID]) {
	    makePromise(this.promise);
	  }

	  if (isArray(input)) {
	    this._input = input;
	    this.length = input.length;
	    this._remaining = input.length;

	    this._result = new Array(this.length);

	    if (this.length === 0) {
	      fulfill(this.promise, this._result);
	    } else {
	      this.length = this.length || 0;
	      this._enumerate();
	      if (this._remaining === 0) {
	        fulfill(this.promise, this._result);
	      }
	    }
	  } else {
	    _reject(this.promise, validationError());
	  }
	}

	function validationError() {
	  return new Error('Array Methods must be provided an Array');
	}
	Enumerator.prototype._enumerate = function () {
	  var length = this.length;
	  var _input = this._input;

	  for (var i = 0; this._state === PENDING && i < length; i++) {
	    this._eachEntry(_input[i], i);
	  }
	};

	Enumerator.prototype._eachEntry = function (entry, i) {
	  var c = this._instanceConstructor;
	  var resolve$$ = c.resolve;

	  if (resolve$$ === resolve) {
	    var _then = getThen(entry);

	    if (_then === then && entry._state !== PENDING) {
	      this._settledAt(entry._state, i, entry._result);
	    } else if (typeof _then !== 'function') {
	      this._remaining--;
	      this._result[i] = entry;
	    } else if (c === Promise) {
	      var promise = new c(noop);
	      handleMaybeThenable(promise, entry, _then);
	      this._willSettleAt(promise, i);
	    } else {
	      this._willSettleAt(new c(function (resolve$$) {
	        return resolve$$(entry);
	      }), i);
	    }
	  } else {
	    this._willSettleAt(resolve$$(entry), i);
	  }
	};

	Enumerator.prototype._settledAt = function (state, i, value) {
	  var promise = this.promise;

	  if (promise._state === PENDING) {
	    this._remaining--;

	    if (state === REJECTED) {
	      _reject(promise, value);
	    } else {
	      this._result[i] = value;
	    }
	  }

	  if (this._remaining === 0) {
	    fulfill(promise, this._result);
	  }
	};

	Enumerator.prototype._willSettleAt = function (promise, i) {
	  var enumerator = this;

	  subscribe(promise, undefined, function (value) {
	    return enumerator._settledAt(FULFILLED, i, value);
	  }, function (reason) {
	    return enumerator._settledAt(REJECTED, i, reason);
	  });
	};

	/**
	  `Promise.all` accepts an array of promises, and returns a new promise which
	  is fulfilled with an array of fulfillment values for the passed promises, or
	  rejected with the reason of the first passed promise to be rejected. It casts all
	  elements of the passed iterable to promises as it runs this algorithm.

	  Example:

	  ```javascript
	  let promise1 = resolve(1);
	  let promise2 = resolve(2);
	  let promise3 = resolve(3);
	  let promises = [ promise1, promise2, promise3 ];

	  Promise.all(promises).then(function(array){
	    // The array here would be [ 1, 2, 3 ];
	  });
	  ```

	  If any of the `promises` given to `all` are rejected, the first promise
	  that is rejected will be given as an argument to the returned promises's
	  rejection handler. For example:

	  Example:

	  ```javascript
	  let promise1 = resolve(1);
	  let promise2 = reject(new Error("2"));
	  let promise3 = reject(new Error("3"));
	  let promises = [ promise1, promise2, promise3 ];

	  Promise.all(promises).then(function(array){
	    // Code here never runs because there are rejected promises!
	  }, function(error) {
	    // error.message === "2"
	  });
	  ```

	  @method all
	  @static
	  @param {Array} entries array of promises
	  @param {String} label optional string for labeling the promise.
	  Useful for tooling.
	  @return {Promise} promise that is fulfilled when all `promises` have been
	  fulfilled, or rejected if any of them become rejected.
	  @static
	*/
	function all(entries) {
	  return new Enumerator(this, entries).promise;
	}

	/**
	  `Promise.race` returns a new promise which is settled in the same way as the
	  first passed promise to settle.

	  Example:

	  ```javascript
	  let promise1 = new Promise(function(resolve, reject){
	    setTimeout(function(){
	      resolve('promise 1');
	    }, 200);
	  });

	  let promise2 = new Promise(function(resolve, reject){
	    setTimeout(function(){
	      resolve('promise 2');
	    }, 100);
	  });

	  Promise.race([promise1, promise2]).then(function(result){
	    // result === 'promise 2' because it was resolved before promise1
	    // was resolved.
	  });
	  ```

	  `Promise.race` is deterministic in that only the state of the first
	  settled promise matters. For example, even if other promises given to the
	  `promises` array argument are resolved, but the first settled promise has
	  become rejected before the other promises became fulfilled, the returned
	  promise will become rejected:

	  ```javascript
	  let promise1 = new Promise(function(resolve, reject){
	    setTimeout(function(){
	      resolve('promise 1');
	    }, 200);
	  });

	  let promise2 = new Promise(function(resolve, reject){
	    setTimeout(function(){
	      reject(new Error('promise 2'));
	    }, 100);
	  });

	  Promise.race([promise1, promise2]).then(function(result){
	    // Code here never runs
	  }, function(reason){
	    // reason.message === 'promise 2' because promise 2 became rejected before
	    // promise 1 became fulfilled
	  });
	  ```

	  An example real-world use case is implementing timeouts:

	  ```javascript
	  Promise.race([ajax('foo.json'), timeout(5000)])
	  ```

	  @method race
	  @static
	  @param {Array} promises array of promises to observe
	  Useful for tooling.
	  @return {Promise} a promise which settles in the same way as the first passed
	  promise to settle.
	*/
	function race(entries) {
	  /*jshint validthis:true */
	  var Constructor = this;

	  if (!isArray(entries)) {
	    return new Constructor(function (_, reject) {
	      return reject(new TypeError('You must pass an array to race.'));
	    });
	  } else {
	    return new Constructor(function (resolve, reject) {
	      var length = entries.length;
	      for (var i = 0; i < length; i++) {
	        Constructor.resolve(entries[i]).then(resolve, reject);
	      }
	    });
	  }
	}

	/**
	  `Promise.reject` returns a promise rejected with the passed `reason`.
	  It is shorthand for the following:

	  ```javascript
	  let promise = new Promise(function(resolve, reject){
	    reject(new Error('WHOOPS'));
	  });

	  promise.then(function(value){
	    // Code here doesn't run because the promise is rejected!
	  }, function(reason){
	    // reason.message === 'WHOOPS'
	  });
	  ```

	  Instead of writing the above, your code now simply becomes the following:

	  ```javascript
	  let promise = Promise.reject(new Error('WHOOPS'));

	  promise.then(function(value){
	    // Code here doesn't run because the promise is rejected!
	  }, function(reason){
	    // reason.message === 'WHOOPS'
	  });
	  ```

	  @method reject
	  @static
	  @param {Any} reason value that the returned promise will be rejected with.
	  Useful for tooling.
	  @return {Promise} a promise rejected with the given `reason`.
	*/
	function reject(reason) {
	  /*jshint validthis:true */
	  var Constructor = this;
	  var promise = new Constructor(noop);
	  _reject(promise, reason);
	  return promise;
	}

	function needsResolver() {
	  throw new TypeError('You must pass a resolver function as the first argument to the promise constructor');
	}

	function needsNew() {
	  throw new TypeError("Failed to construct 'Promise': Please use the 'new' operator, this object constructor cannot be called as a function.");
	}

	/**
	  Promise objects represent the eventual result of an asynchronous operation. The
	  primary way of interacting with a promise is through its `then` method, which
	  registers callbacks to receive either a promise's eventual value or the reason
	  why the promise cannot be fulfilled.

	  Terminology
	  -----------

	  - `promise` is an object or function with a `then` method whose behavior conforms to this specification.
	  - `thenable` is an object or function that defines a `then` method.
	  - `value` is any legal JavaScript value (including undefined, a thenable, or a promise).
	  - `exception` is a value that is thrown using the throw statement.
	  - `reason` is a value that indicates why a promise was rejected.
	  - `settled` the final resting state of a promise, fulfilled or rejected.

	  A promise can be in one of three states: pending, fulfilled, or rejected.

	  Promises that are fulfilled have a fulfillment value and are in the fulfilled
	  state.  Promises that are rejected have a rejection reason and are in the
	  rejected state.  A fulfillment value is never a thenable.

	  Promises can also be said to *resolve* a value.  If this value is also a
	  promise, then the original promise's settled state will match the value's
	  settled state.  So a promise that *resolves* a promise that rejects will
	  itself reject, and a promise that *resolves* a promise that fulfills will
	  itself fulfill.


	  Basic Usage:
	  ------------

	  ```js
	  let promise = new Promise(function(resolve, reject) {
	    // on success
	    resolve(value);

	    // on failure
	    reject(reason);
	  });

	  promise.then(function(value) {
	    // on fulfillment
	  }, function(reason) {
	    // on rejection
	  });
	  ```

	  Advanced Usage:
	  ---------------

	  Promises shine when abstracting away asynchronous interactions such as
	  `XMLHttpRequest`s.

	  ```js
	  function getJSON(url) {
	    return new Promise(function(resolve, reject){
	      let xhr = new XMLHttpRequest();

	      xhr.open('GET', url);
	      xhr.onreadystatechange = handler;
	      xhr.responseType = 'json';
	      xhr.setRequestHeader('Accept', 'application/json');
	      xhr.send();

	      function handler() {
	        if (this.readyState === this.DONE) {
	          if (this.status === 200) {
	            resolve(this.response);
	          } else {
	            reject(new Error('getJSON: `' + url + '` failed with status: [' + this.status + ']'));
	          }
	        }
	      };
	    });
	  }

	  getJSON('/posts.json').then(function(json) {
	    // on fulfillment
	  }, function(reason) {
	    // on rejection
	  });
	  ```

	  Unlike callbacks, promises are great composable primitives.

	  ```js
	  Promise.all([
	    getJSON('/posts'),
	    getJSON('/comments')
	  ]).then(function(values){
	    values[0] // => postsJSON
	    values[1] // => commentsJSON

	    return values;
	  });
	  ```

	  @class Promise
	  @param {function} resolver
	  Useful for tooling.
	  @constructor
	*/
	function Promise(resolver) {
	  this[PROMISE_ID] = nextId();
	  this._result = this._state = undefined;
	  this._subscribers = [];

	  if (noop !== resolver) {
	    typeof resolver !== 'function' && needsResolver();
	    this instanceof Promise ? initializePromise(this, resolver) : needsNew();
	  }
	}

	Promise.all = all;
	Promise.race = race;
	Promise.resolve = resolve;
	Promise.reject = reject;
	Promise._setScheduler = setScheduler;
	Promise._setAsap = setAsap;
	Promise._asap = asap;

	Promise.prototype = {
	  constructor: Promise,

	  /**
	    The primary way of interacting with a promise is through its `then` method,
	    which registers callbacks to receive either a promise's eventual value or the
	    reason why the promise cannot be fulfilled.
	  
	    ```js
	    findUser().then(function(user){
	      // user is available
	    }, function(reason){
	      // user is unavailable, and you are given the reason why
	    });
	    ```
	  
	    Chaining
	    --------
	  
	    The return value of `then` is itself a promise.  This second, 'downstream'
	    promise is resolved with the return value of the first promise's fulfillment
	    or rejection handler, or rejected if the handler throws an exception.
	  
	    ```js
	    findUser().then(function (user) {
	      return user.name;
	    }, function (reason) {
	      return 'default name';
	    }).then(function (userName) {
	      // If `findUser` fulfilled, `userName` will be the user's name, otherwise it
	      // will be `'default name'`
	    });
	  
	    findUser().then(function (user) {
	      throw new Error('Found user, but still unhappy');
	    }, function (reason) {
	      throw new Error('`findUser` rejected and we're unhappy');
	    }).then(function (value) {
	      // never reached
	    }, function (reason) {
	      // if `findUser` fulfilled, `reason` will be 'Found user, but still unhappy'.
	      // If `findUser` rejected, `reason` will be '`findUser` rejected and we're unhappy'.
	    });
	    ```
	    If the downstream promise does not specify a rejection handler, rejection reasons will be propagated further downstream.
	  
	    ```js
	    findUser().then(function (user) {
	      throw new PedagogicalException('Upstream error');
	    }).then(function (value) {
	      // never reached
	    }).then(function (value) {
	      // never reached
	    }, function (reason) {
	      // The `PedgagocialException` is propagated all the way down to here
	    });
	    ```
	  
	    Assimilation
	    ------------
	  
	    Sometimes the value you want to propagate to a downstream promise can only be
	    retrieved asynchronously. This can be achieved by returning a promise in the
	    fulfillment or rejection handler. The downstream promise will then be pending
	    until the returned promise is settled. This is called *assimilation*.
	  
	    ```js
	    findUser().then(function (user) {
	      return findCommentsByAuthor(user);
	    }).then(function (comments) {
	      // The user's comments are now available
	    });
	    ```
	  
	    If the assimliated promise rejects, then the downstream promise will also reject.
	  
	    ```js
	    findUser().then(function (user) {
	      return findCommentsByAuthor(user);
	    }).then(function (comments) {
	      // If `findCommentsByAuthor` fulfills, we'll have the value here
	    }, function (reason) {
	      // If `findCommentsByAuthor` rejects, we'll have the reason here
	    });
	    ```
	  
	    Simple Example
	    --------------
	  
	    Synchronous Example
	  
	    ```javascript
	    let result;
	  
	    try {
	      result = findResult();
	      // success
	    } catch(reason) {
	      // failure
	    }
	    ```
	  
	    Errback Example
	  
	    ```js
	    findResult(function(result, err){
	      if (err) {
	        // failure
	      } else {
	        // success
	      }
	    });
	    ```
	  
	    Promise Example;
	  
	    ```javascript
	    findResult().then(function(result){
	      // success
	    }, function(reason){
	      // failure
	    });
	    ```
	  
	    Advanced Example
	    --------------
	  
	    Synchronous Example
	  
	    ```javascript
	    let author, books;
	  
	    try {
	      author = findAuthor();
	      books  = findBooksByAuthor(author);
	      // success
	    } catch(reason) {
	      // failure
	    }
	    ```
	  
	    Errback Example
	  
	    ```js
	  
	    function foundBooks(books) {
	  
	    }
	  
	    function failure(reason) {
	  
	    }
	  
	    findAuthor(function(author, err){
	      if (err) {
	        failure(err);
	        // failure
	      } else {
	        try {
	          findBoooksByAuthor(author, function(books, err) {
	            if (err) {
	              failure(err);
	            } else {
	              try {
	                foundBooks(books);
	              } catch(reason) {
	                failure(reason);
	              }
	            }
	          });
	        } catch(error) {
	          failure(err);
	        }
	        // success
	      }
	    });
	    ```
	  
	    Promise Example;
	  
	    ```javascript
	    findAuthor().
	      then(findBooksByAuthor).
	      then(function(books){
	        // found books
	    }).catch(function(reason){
	      // something went wrong
	    });
	    ```
	  
	    @method then
	    @param {Function} onFulfilled
	    @param {Function} onRejected
	    Useful for tooling.
	    @return {Promise}
	  */
	  then: then,

	  /**
	    `catch` is simply sugar for `then(undefined, onRejection)` which makes it the same
	    as the catch block of a try/catch statement.
	  
	    ```js
	    function findAuthor(){
	      throw new Error('couldn't find that author');
	    }
	  
	    // synchronous
	    try {
	      findAuthor();
	    } catch(reason) {
	      // something went wrong
	    }
	  
	    // async with promises
	    findAuthor().catch(function(reason){
	      // something went wrong
	    });
	    ```
	  
	    @method catch
	    @param {Function} onRejection
	    Useful for tooling.
	    @return {Promise}
	  */
	  'catch': function _catch(onRejection) {
	    return this.then(null, onRejection);
	  }
	};

	function polyfill() {
	    var local = undefined;

	    if (typeof commonjsGlobal !== 'undefined') {
	        local = commonjsGlobal;
	    } else if (typeof self !== 'undefined') {
	        local = self;
	    } else {
	        try {
	            local = Function('return this')();
	        } catch (e) {
	            throw new Error('polyfill failed because global object is unavailable in this environment');
	        }
	    }

	    var P = local.Promise;

	    if (P) {
	        var promiseToString = null;
	        try {
	            promiseToString = Object.prototype.toString.call(P.resolve());
	        } catch (e) {
	            // silently ignored
	        }

	        if (promiseToString === '[object Promise]' && !P.cast) {
	            return;
	        }
	    }

	    local.Promise = Promise;
	}

	// Strange compat..
	Promise.polyfill = polyfill;
	Promise.Promise = Promise;

	return Promise;

	})));

	});

	es6Promise.polyfill();
		

	// import work from 'webworkify';
	// import triangulationWorker from './workers/triangulationWorker'

	// constructing an object that allows for a chained interface.
	// for example stuff like:
	// 
	// triangulate( params )
	//     .fromImage( img )
	//     .toImageData()
	// 
	// etc...

	function browser ( params ) {
		params = sanitizeInput( params );

		var isInputSync = false;
		var isOutputSync = false;

		var worker = new Worker( URL.createObjectURL(new Blob(["var commonjsGlobal = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};\n\nfunction createCommonjsModule(fn, module) {\n\treturn module = { exports: {} }, fn(module, module.exports), module.exports;\n}\n\nvar delaunay = createCommonjsModule(function (module) {\nfunction Triangle(a, b, c) {\n  this.a = a;\n  this.b = b;\n  this.c = c;\n\n  var A = b.x - a.x,\n      B = b.y - a.y,\n      C = c.x - a.x,\n      D = c.y - a.y,\n      E = A * (a.x + b.x) + B * (a.y + b.y),\n      F = C * (a.x + c.x) + D * (a.y + c.y),\n      G = 2 * (A * (c.y - b.y) - B * (c.x - b.x)),\n      minx, miny, dx, dy;\n\n  /* If the points of the triangle are collinear, then just find the\n   * extremes and use the midpoint as the center of the circumcircle. */\n  if(Math.abs(G) < 0.000001) {\n    minx = Math.min(a.x, b.x, c.x);\n    miny = Math.min(a.y, b.y, c.y);\n    dx   = (Math.max(a.x, b.x, c.x) - minx) * 0.5;\n    dy   = (Math.max(a.y, b.y, c.y) - miny) * 0.5;\n\n    this.x = minx + dx;\n    this.y = miny + dy;\n    this.r = dx * dx + dy * dy;\n  }\n\n  else {\n    this.x = (D*E - B*F) / G;\n    this.y = (A*F - C*E) / G;\n    dx = this.x - a.x;\n    dy = this.y - a.y;\n    this.r = dx * dx + dy * dy;\n  }\n}\n\nTriangle.prototype.draw = function(ctx) {\n  ctx.beginPath();\n  ctx.moveTo(this.a.x, this.a.y);\n  ctx.lineTo(this.b.x, this.b.y);\n  ctx.lineTo(this.c.x, this.c.y);\n  ctx.closePath();\n  ctx.stroke();\n};\n\nfunction byX(a, b) {\n  return b.x - a.x\n}\n\nfunction dedup(edges) {\n  var j = edges.length,\n      a, b, i, m, n;\n\n  outer: while(j) {\n    b = edges[--j];\n    a = edges[--j];\n    i = j;\n    while(i) {\n      n = edges[--i];\n      m = edges[--i];\n      if((a === m && b === n) || (a === n && b === m)) {\n        edges.splice(j, 2);\n        edges.splice(i, 2);\n        j -= 2;\n        continue outer\n      }\n    }\n  }\n}\n\nfunction triangulate(vertices) {\n  /* Bail if there aren't enough vertices to form any triangles. */\n  if(vertices.length < 3)\n    { return [] }\n\n  /* Ensure the vertex array is in order of descending X coordinate\n   * (which is needed to ensure a subquadratic runtime), and then find\n   * the bounding box around the points. */\n  vertices.sort(byX);\n\n  var i    = vertices.length - 1,\n      xmin = vertices[i].x,\n      xmax = vertices[0].x,\n      ymin = vertices[i].y,\n      ymax = ymin;\n\n  while(i--) {\n    if(vertices[i].y < ymin) { ymin = vertices[i].y; }\n    if(vertices[i].y > ymax) { ymax = vertices[i].y; }\n  }\n\n  /* Find a supertriangle, which is a triangle that surrounds all the\n   * vertices. This is used like something of a sentinel value to remove\n   * cases in the main algorithm, and is removed before we return any\n   * results.\n   *\n   * Once found, put it in the \"open\" list. (The \"open\" list is for\n   * triangles who may still need to be considered; the \"closed\" list is\n   * for triangles which do not.) */\n  var dx     = xmax - xmin,\n      dy     = ymax - ymin,\n      dmax   = (dx > dy) ? dx : dy,\n      xmid   = (xmax + xmin) * 0.5,\n      ymid   = (ymax + ymin) * 0.5,\n      open   = [\n        new Triangle(\n          {x: xmid - 20 * dmax, y: ymid -      dmax, __sentinel: true},\n          {x: xmid            , y: ymid + 20 * dmax, __sentinel: true},\n          {x: xmid + 20 * dmax, y: ymid -      dmax, __sentinel: true}\n        )\n      ],\n      closed = [],\n      edges = [],\n      j, a, b;\n\n  /* Incrementally add each vertex to the mesh. */\n  i = vertices.length;\n  while(i--) {\n    /* For each open triangle, check to see if the current point is\n     * inside it's circumcircle. If it is, remove the triangle and add\n     * it's edges to an edge list. */\n    edges.length = 0;\n    j = open.length;\n    while(j--) {\n      /* If this point is to the right of this triangle's circumcircle,\n       * then this triangle should never get checked again. Remove it\n       * from the open list, add it to the closed list, and skip. */\n      dx = vertices[i].x - open[j].x;\n      if(dx > 0 && dx * dx > open[j].r) {\n        closed.push(open[j]);\n        open.splice(j, 1);\n        continue\n      }\n\n      /* If not, skip this triangle. */\n      dy = vertices[i].y - open[j].y;\n      if(dx * dx + dy * dy > open[j].r)\n        { continue }\n\n      /* Remove the triangle and add it's edges to the edge list. */\n      edges.push(\n        open[j].a, open[j].b,\n        open[j].b, open[j].c,\n        open[j].c, open[j].a\n      );\n      open.splice(j, 1);\n    }\n\n    /* Remove any doubled edges. */\n    dedup(edges);\n\n    /* Add a new triangle for each edge. */\n    j = edges.length;\n    while(j) {\n      b = edges[--j];\n      a = edges[--j];\n      open.push(new Triangle(a, b, vertices[i]));\n    }\n  }\n\n  /* Copy any remaining open triangles to the closed list, and then\n   * remove any triangles that share a vertex with the supertriangle. */\n  Array.prototype.push.apply(closed, open);\n\n  i = closed.length;\n  while(i--)\n    { if(closed[i].a.__sentinel ||\n       closed[i].b.__sentinel ||\n       closed[i].c.__sentinel)\n      { closed.splice(i, 1); } }\n\n  /* Yay, we're done! */\n  return closed\n}\n\n{\n    module.exports = {\n        Triangle: Triangle,\n        triangulate: triangulate\n    };\n}\n});\nvar delaunay_1 = delaunay.Triangle;\nvar delaunay_2 = delaunay.triangulate;\n\nvar sobel = createCommonjsModule(function (module, exports) {\n(function(root) {\n\n  function Sobel(imageData) {\n    if (!(this instanceof Sobel)) {\n      return new Sobel(imageData);\n    }\n\n    var width = imageData.width;\n    var height = imageData.height;\n\n    var kernelX = [\n      [-1,0,1],\n      [-2,0,2],\n      [-1,0,1]\n    ];\n\n    var kernelY = [\n      [-1,-2,-1],\n      [0,0,0],\n      [1,2,1]\n    ];\n\n    var sobelData = [];\n    var grayscaleData = [];\n\n    function bindPixelAt(data) {\n      return function(x, y, i) {\n        i = i || 0;\n        return data[((width * y) + x) * 4 + i];\n      };\n    }\n\n    var data = imageData.data;\n    var pixelAt = bindPixelAt(data);\n    var x, y;\n\n    for (y = 0; y < height; y++) {\n      for (x = 0; x < width; x++) {\n        var r = pixelAt(x, y, 0);\n        var g = pixelAt(x, y, 1);\n        var b = pixelAt(x, y, 2);\n\n        var avg = (r + g + b) / 3;\n        grayscaleData.push(avg, avg, avg, 255);\n      }\n    }\n\n    pixelAt = bindPixelAt(grayscaleData);\n\n    for (y = 0; y < height; y++) {\n      for (x = 0; x < width; x++) {\n        var pixelX = (\n            (kernelX[0][0] * pixelAt(x - 1, y - 1)) +\n            (kernelX[0][1] * pixelAt(x, y - 1)) +\n            (kernelX[0][2] * pixelAt(x + 1, y - 1)) +\n            (kernelX[1][0] * pixelAt(x - 1, y)) +\n            (kernelX[1][1] * pixelAt(x, y)) +\n            (kernelX[1][2] * pixelAt(x + 1, y)) +\n            (kernelX[2][0] * pixelAt(x - 1, y + 1)) +\n            (kernelX[2][1] * pixelAt(x, y + 1)) +\n            (kernelX[2][2] * pixelAt(x + 1, y + 1))\n        );\n\n        var pixelY = (\n          (kernelY[0][0] * pixelAt(x - 1, y - 1)) +\n          (kernelY[0][1] * pixelAt(x, y - 1)) +\n          (kernelY[0][2] * pixelAt(x + 1, y - 1)) +\n          (kernelY[1][0] * pixelAt(x - 1, y)) +\n          (kernelY[1][1] * pixelAt(x, y)) +\n          (kernelY[1][2] * pixelAt(x + 1, y)) +\n          (kernelY[2][0] * pixelAt(x - 1, y + 1)) +\n          (kernelY[2][1] * pixelAt(x, y + 1)) +\n          (kernelY[2][2] * pixelAt(x + 1, y + 1))\n        );\n\n        var magnitude = Math.sqrt((pixelX * pixelX) + (pixelY * pixelY))>>>0;\n\n        sobelData.push(magnitude, magnitude, magnitude, 255);\n      }\n    }\n\n    var clampedArray = sobelData;\n\n    if (typeof Uint8ClampedArray === 'function') {\n      clampedArray = new Uint8ClampedArray(sobelData);\n    }\n\n    clampedArray.toImageData = function() {\n      return Sobel.toImageData(clampedArray, width, height);\n    };\n\n    return clampedArray;\n  }\n\n  Sobel.toImageData = function toImageData(data, width, height) {\n    if (typeof ImageData === 'function' && Object.prototype.toString.call(data) === '[object Uint16Array]') {\n      return new ImageData(data, width, height);\n    } else {\n      if (typeof window === 'object' && typeof window.document === 'object') {\n        var canvas = document.createElement('canvas');\n\n        if (typeof canvas.getContext === 'function') {\n          var context = canvas.getContext('2d');\n          var imageData = context.createImageData(width, height);\n          imageData.data.set(data);\n          return imageData;\n        } else {\n          return new FakeImageData(data, width, height);\n        }\n      } else {\n        return new FakeImageData(data, width, height);\n      }\n    }\n  };\n\n  function FakeImageData(data, width, height) {\n    return {\n      width: width,\n      height: height,\n      data: data\n    };\n  }\n\n  {\n    if (module.exports) {\n      exports = module.exports = Sobel;\n    }\n    exports.Sobel = Sobel;\n  }\n\n})(commonjsGlobal);\n});\nvar sobel_1 = sobel.Sobel;\n\nfunction isImageData (imageData) {\n\treturn (\n\t\timageData && \n\t\ttypeof imageData.width === 'number' &&\n\t\ttypeof imageData.height === 'number' &&\n\t\timageData.data &&\n\t\ttypeof imageData.data.length === 'number' &&\n\t\ttypeof imageData.data === 'object'\n\t);\n}\n\nvar Canvas = function Canvas ( width, height ) {\n\tif ( width === void 0 ) width = 300;\n\tif ( height === void 0 ) height = 150;\n\n\tif ( typeof window === 'undefined' ) {\n\t\tthis.canvasEl = { width: width, height: height };\n\t\tthis.ctx = null;\n\t} else {\n\t\tthis.canvasEl = document.createElement( 'canvas' );\n\t\tthis.canvasEl.width = width;\n\t\tthis.canvasEl.height = height;\n\t\tthis.ctx = this.canvasEl.getContext( '2d' );\n\t} \n};\n\nvar prototypeAccessors = { width: { configurable: true },height: { configurable: true } };\n\nCanvas.prototype.getContext = function getContext () {\n\treturn this.ctx;\n};\n\nCanvas.prototype.toDataURL = function toDataURL ( type, encoderOptions, cb ) {\n\tif ( typeof cb === 'function' ) {\n\t\tcb( this.canvasEl.toDataURL( type, encoderOptions ) );\n\t} else {\n\t\treturn this.canvasEl.toDataURL( type, encoderOptions );\n\t}\n};\n\t\nprototypeAccessors.width.get = function () {\n\treturn this.canvasEl.width;\n};\n\t\nprototypeAccessors.width.set = function ( newWidth ) {\n\tthis.canvasEl.width = newWidth;\n};\n\nprototypeAccessors.height.get = function () {\n\treturn this.canvasEl.height;\n};\n\nprototypeAccessors.height.set = function ( newHeight ) {\n\tthis.canvasEl.height = newHeight;\n};\n\nObject.defineProperties( Canvas.prototype, prototypeAccessors );\n\nif ( typeof window !== 'undefined' ) {\n\tCanvas.Image = Image;\n}\n\n// import Canvas from 'canvas';\n\nfunction copyImageData (imageData) {\n\tif ( isImageData ( imageData ) ) {\n\t\tif ( typeof Uint8ClampedArray === 'undefined' ) {\n\t\t\tif ( typeof window === 'undefined' ) {\n\t\t\t\tthrow new Error( \"Can't copy imageData in webworker without Uint8ClampedArray support.\" );\n\t\t\t\treturn imageData;\n\t\t\t} else {\n\t\t\t\treturn copyImageDataWithCanvas( imageData );\n\t\t\t}\n\t\t} else {\n\t\t\tvar clampedArray = new Uint8ClampedArray( imageData.data );\n\n\t\t\tif ( typeof ImageData === 'undefined' ) {\n\t\t\t\t// http://stackoverflow.com/a/15238036/229189\n\t\t\t\treturn {\n\t\t\t\t\twidth: imageData.width,\n\t\t\t\t\theight: imageData.height,\n\t\t\t\t\tdata: clampedArray\n\t\t\t\t};\n\t\t\t} else {\n\t\t\t\t// http://stackoverflow.com/a/15908922/229189#comment57192591_15908922\n\t\t\t\tvar result;\n\n\t\t\t\ttry {\n\t\t\t\t\tresult = new ImageData( clampedArray, imageData.width, imageData.height );\n\t\t\t\t} catch ( err ) {\n\t\t\t\t\tif ( typeof window === 'undefined' ) {\n\t\t\t\t\t\tthrow new Error( \"Can't copy imageData in webworker without proper ImageData() support.\" );\n\t\t\t\t\t\tresult = imageData;\n\t\t\t\t\t} else {\n\t\t\t\t\t\tresult = copyImageDataWithCanvas( imageData );\n\t\t\t\t\t}\n\t\t\t\t}\n\n\t\t\t\treturn result;\n\t\t\t}\n\t\t}\n\t} else {\n\t\tthrow new Error( 'Given imageData object is not useable.' );\n\t\treturn;\n\t}\n}\n\n// http://stackoverflow.com/a/11918126/229189\nfunction copyImageDataWithCanvas ( imageData ) {\n\tvar canvas = new Canvas( imageData.width, imageData.height );\n\tvar ctx = canvas.getContext( '2d' );\n\n\tctx.putImageData( imageData, 0, 0 );\n\t\t\t\t\n\treturn ctx.getImageData( 0, 0, imageData.width, imageData.height );\n}\n\n/*\n    StackBlur - a fast almost Gaussian Blur For Canvas\n\n    Version:     0.5\n    Author:        Mario Klingemann\n    Contact:     mario@quasimondo.com\n    Website:    http://www.quasimondo.com/StackBlurForCanvas\n    Twitter:    @quasimondo\n\n    In case you find this class useful - especially in commercial projects -\n    I am not totally unhappy for a small donation to my PayPal account\n    mario@quasimondo.de\n\n    Or support me on flattr:\n    https://flattr.com/thing/72791/StackBlur-a-fast-almost-Gaussian-Blur-Effect-for-CanvasJavascript\n\n    Copyright (c) 2010 Mario Klingemann\n\n    Permission is hereby granted, free of charge, to any person\n    obtaining a copy of this software and associated documentation\n    files (the \"Software\"), to deal in the Software without\n    restriction, including without limitation the rights to use,\n    copy, modify, merge, publish, distribute, sublicense, and/or sell\n    copies of the Software, and to permit persons to whom the\n    Software is furnished to do so, subject to the following\n    conditions:\n\n    The above copyright notice and this permission notice shall be\n    included in all copies or substantial portions of the Software.\n\n    THE SOFTWARE IS PROVIDED \"AS IS\", WITHOUT WARRANTY OF ANY KIND,\n    EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES\n    OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND\n    NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT\n    HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,\n    WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING\n    FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR\n    OTHER DEALINGS IN THE SOFTWARE.\n    */\n\nvar mul_table = [\n    512,512,456,512,328,456,335,512,405,328,271,456,388,335,292,512,\n    454,405,364,328,298,271,496,456,420,388,360,335,312,292,273,512,\n    482,454,428,405,383,364,345,328,312,298,284,271,259,496,475,456,\n    437,420,404,388,374,360,347,335,323,312,302,292,282,273,265,512,\n    497,482,468,454,441,428,417,405,394,383,373,364,354,345,337,328,\n    320,312,305,298,291,284,278,271,265,259,507,496,485,475,465,456,\n    446,437,428,420,412,404,396,388,381,374,367,360,354,347,341,335,\n    329,323,318,312,307,302,297,292,287,282,278,273,269,265,261,512,\n    505,497,489,482,475,468,461,454,447,441,435,428,422,417,411,405,\n    399,394,389,383,378,373,368,364,359,354,350,345,341,337,332,328,\n    324,320,316,312,309,305,301,298,294,291,287,284,281,278,274,271,\n    268,265,262,259,257,507,501,496,491,485,480,475,470,465,460,456,\n    451,446,442,437,433,428,424,420,416,412,408,404,400,396,392,388,\n    385,381,377,374,370,367,363,360,357,354,350,347,344,341,338,335,\n    332,329,326,323,320,318,315,312,310,307,304,302,299,297,294,292,\n    289,287,285,282,280,278,275,273,271,269,267,265,263,261,259];\n\n\nvar shg_table = [\n    9, 11, 12, 13, 13, 14, 14, 15, 15, 15, 15, 16, 16, 16, 16, 17,\n    17, 17, 17, 17, 17, 17, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19,\n    19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 20, 20, 20,\n    20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 21,\n    21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21,\n    21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 22, 22, 22, 22, 22, 22,\n    22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22,\n    22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 23,\n    23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23,\n    23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23,\n    23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23,\n    23, 23, 23, 23, 23, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24,\n    24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24,\n    24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24,\n    24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24,\n    24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24 ];\n\nfunction BlurStack () {\n\tthis.r = 0;\n\tthis.g = 0;\n\tthis.b = 0;\n\tthis.a = 0;\n\tthis.next = null;\n}\n\nfunction stackblur ( imageData, top_x, top_y, width, height, radius ) {\n\tvar pixels = imageData.data;\n\n\tvar x, y, i, p, yp, yi, yw, r_sum, g_sum, b_sum, a_sum,\n\t\tr_out_sum, g_out_sum, b_out_sum, a_out_sum,\n\t\tr_in_sum, g_in_sum, b_in_sum, a_in_sum,\n\t\tpr, pg, pb, pa, rbs;\n\n\tvar div = radius + radius + 1;\n\tvar widthMinus1  = width - 1;\n\tvar heightMinus1 = height - 1;\n\tvar radiusPlus1  = radius + 1;\n\tvar sumFactor = radiusPlus1 * ( radiusPlus1 + 1 ) / 2;\n\n\tvar stackStart = new BlurStack();\n\tvar stack = stackStart;\n\t\n\tfor ( i = 1; i < div; i++ ) {\n\t\tstack = stack.next = new BlurStack();\n\t\tif (i == radiusPlus1) { var stackEnd = stack; }\n\t}\n\tstack.next = stackStart;\n\t\n\tvar stackIn = null;\n\tvar stackOut = null;\n\n\tyw = yi = 0;\n\n\tvar mul_sum = mul_table[radius];\n\tvar shg_sum = shg_table[radius];\n\n\tfor ( y = 0; y < height; y++ ) {\n\t\tr_in_sum = g_in_sum = b_in_sum = a_in_sum = r_sum = g_sum = b_sum = a_sum = 0;\n\n\t\tr_out_sum = radiusPlus1 * ( pr = pixels[yi] );\n\t\tg_out_sum = radiusPlus1 * ( pg = pixels[yi+1] );\n\t\tb_out_sum = radiusPlus1 * ( pb = pixels[yi+2] );\n\t\ta_out_sum = radiusPlus1 * ( pa = pixels[yi+3] );\n\n\t\tr_sum += sumFactor * pr;\n\t\tg_sum += sumFactor * pg;\n\t\tb_sum += sumFactor * pb;\n\t\ta_sum += sumFactor * pa;\n\n\t\tstack = stackStart;\n\n\t\tfor ( i = 0; i < radiusPlus1; i++ ) {\n\t\t\tstack.r = pr;\n\t\t\tstack.g = pg;\n\t\t\tstack.b = pb;\n\t\t\tstack.a = pa;\n\t\t\tstack = stack.next;\n\t\t}\n\n\t\tfor ( i = 1; i < radiusPlus1; i++ ) {\n\t\t\tp = yi + ( ( widthMinus1 < i ? widthMinus1 : i ) << 2 );\n\t\t\tr_sum += ( stack.r = ( pr = pixels[p] ) ) * ( rbs = radiusPlus1 - i );\n\t\t\tg_sum += ( stack.g = ( pg = pixels[p+1] ) ) * rbs;\n\t\t\tb_sum += ( stack.b = ( pb = pixels[p+2] ) ) * rbs;\n\t\t\ta_sum += ( stack.a = ( pa = pixels[p+3] ) ) * rbs;\n\n\t\t\tr_in_sum += pr;\n\t\t\tg_in_sum += pg;\n\t\t\tb_in_sum += pb;\n\t\t\ta_in_sum += pa;\n\n\t\t\tstack = stack.next;\n\t\t}\n\n\n\t\tstackIn = stackStart;\n\t\tstackOut = stackEnd;\n\n\t\tfor (x = 0; x < width; x++) {\n\t\t\tpixels[yi+3] = pa = (a_sum * mul_sum) >> shg_sum;\n\t\t\t\n\t\t\tif (pa != 0) {\n\t\t\t\tpa = 255 / pa;\n\t\t\t\tpixels[yi]   = ( ( r_sum * mul_sum ) >> shg_sum ) * pa;\n\t\t\t\tpixels[yi+1] = ( ( g_sum * mul_sum ) >> shg_sum ) * pa;\n\t\t\t\tpixels[yi+2] = ( ( b_sum * mul_sum ) >> shg_sum ) * pa;\n\t\t\t} else {\n\t\t\t\tpixels[yi] = pixels[yi+1] = pixels[yi+2] = 0;\n\t\t\t}\n\n\t\t\tr_sum -= r_out_sum;\n\t\t\tg_sum -= g_out_sum;\n\t\t\tb_sum -= b_out_sum;\n\t\t\ta_sum -= a_out_sum;\n\n\t\t\tr_out_sum -= stackIn.r;\n\t\t\tg_out_sum -= stackIn.g;\n\t\t\tb_out_sum -= stackIn.b;\n\t\t\ta_out_sum -= stackIn.a;\n\n\t\t\tp =  ( yw + ( ( p = x + radius + 1 ) < widthMinus1 ? p : widthMinus1 ) ) << 2;\n\n\t\t\tr_in_sum += ( stackIn.r = pixels[p] );\n\t\t\tg_in_sum += ( stackIn.g = pixels[p+1] );\n\t\t\tb_in_sum += ( stackIn.b = pixels[p+2] );\n\t\t\ta_in_sum += ( stackIn.a = pixels[p+3] );\n\n\t\t\tr_sum += r_in_sum;\n\t\t\tg_sum += g_in_sum;\n\t\t\tb_sum += b_in_sum;\n\t\t\ta_sum += a_in_sum;\n\n\t\t\tstackIn = stackIn.next;\n\n\t\t\tr_out_sum += ( pr = stackOut.r );\n\t\t\tg_out_sum += ( pg = stackOut.g );\n\t\t\tb_out_sum += ( pb = stackOut.b );\n\t\t\ta_out_sum += ( pa = stackOut.a );\n\n\t\t\tr_in_sum -= pr;\n\t\t\tg_in_sum -= pg;\n\t\t\tb_in_sum -= pb;\n\t\t\ta_in_sum -= pa;\n\n\t\t\tstackOut = stackOut.next;\n\n\t\t\tyi += 4;\n\t\t}\n\t\tyw += width;\n\t}\n\n\n\tfor ( x = 0; x < width; x++ ) {\n\t\tg_in_sum = b_in_sum = a_in_sum = r_in_sum = g_sum = b_sum = a_sum = r_sum = 0;\n\n\t\tyi = x << 2;\n\t\tr_out_sum = radiusPlus1 * ( pr = pixels[yi] );\n\t\tg_out_sum = radiusPlus1 * ( pg = pixels[yi+1] );\n\t\tb_out_sum = radiusPlus1 * ( pb = pixels[yi+2] );\n\t\ta_out_sum = radiusPlus1 * ( pa = pixels[yi+3] );\n\n\t\tr_sum += sumFactor * pr;\n\t\tg_sum += sumFactor * pg;\n\t\tb_sum += sumFactor * pb;\n\t\ta_sum += sumFactor * pa;\n\n\t\tstack = stackStart;\n\n\t\tfor ( i = 0; i < radiusPlus1; i++) {\n\t\t\tstack.r = pr;\n\t\t\tstack.g = pg;\n\t\t\tstack.b = pb;\n\t\t\tstack.a = pa;\n\t\t\tstack = stack.next;\n\t\t}\n\n\t\typ = width;\n\n\t\tfor ( i = 1; i <= radius; i++ ) {\n\t\t\tyi = ( yp + x ) << 2;\n\n\t\t\tr_sum += ( stack.r = ( pr = pixels[yi] ) ) * (rbs = radiusPlus1 - i);\n\t\t\tg_sum += ( stack.g = ( pg = pixels[yi+1] ) ) * rbs;\n\t\t\tb_sum += ( stack.b = ( pb = pixels[yi+2] ) ) * rbs;\n\t\t\ta_sum += ( stack.a = ( pa = pixels[yi+3] ) ) * rbs;\n\n\t\t\tr_in_sum += pr;\n\t\t\tg_in_sum += pg;\n\t\t\tb_in_sum += pb;\n\t\t\ta_in_sum += pa;\n\n\t\t\tstack = stack.next;\n\n\t\t\tif ( i < heightMinus1 ) {\n\t\t\t\typ += width;\n\t\t\t}\n\t\t}\n\n\t\tyi = x;\n\t\tstackIn = stackStart;\n\t\tstackOut = stackEnd;\n\n\t\tfor ( y = 0; y < height; y++ ) {\n\t\t\tp = yi << 2;\n\t\t\tpixels[p+3] = pa = ( a_sum * mul_sum ) >> shg_sum;\n\t\t\t\n\t\t\tif ( pa > 0 ) {\n\t\t\t\tpa = 255 / pa;\n\t\t\t\tpixels[p]   = ( ( r_sum * mul_sum ) >> shg_sum) * pa;\n\t\t\t\tpixels[p+1] = ( ( g_sum * mul_sum ) >> shg_sum) * pa;\n\t\t\t\tpixels[p+2] = ( ( b_sum * mul_sum ) >> shg_sum) * pa;\n\t\t\t} else {\n\t\t\t\tpixels[p] = pixels[p+1] = pixels[p+2] = 0;\n\t\t\t}\n\n\t\t\tr_sum -= r_out_sum;\n\t\t\tg_sum -= g_out_sum;\n\t\t\tb_sum -= b_out_sum;\n\t\t\ta_sum -= a_out_sum;\n\n\t\t\tr_out_sum -= stackIn.r;\n\t\t\tg_out_sum -= stackIn.g;\n\t\t\tb_out_sum -= stackIn.b;\n\t\t\ta_out_sum -= stackIn.a;\n\n\t\t\tp = ( x + ( ( ( p = y + radiusPlus1 ) < heightMinus1 ? p : heightMinus1 ) * width ) ) << 2;\n\n\t\t\tr_sum += ( r_in_sum += ( stackIn.r = pixels[p] ) );\n\t\t\tg_sum += ( g_in_sum += ( stackIn.g = pixels[p+1] ) );\n\t\t\tb_sum += ( b_in_sum += ( stackIn.b = pixels[p+2] ) );\n\t\t\ta_sum += ( a_in_sum += ( stackIn.a = pixels[p+3] ) );\n\n\t\t\tstackIn = stackIn.next;\n\n\t\t\tr_out_sum += ( pr = stackOut.r );\n\t\t\tg_out_sum += ( pg = stackOut.g );\n\t\t\tb_out_sum += ( pb = stackOut.b );\n\t\t\ta_out_sum += ( pa = stackOut.a );\n\n\t\t\tr_in_sum -= pr;\n\t\t\tg_in_sum -= pg;\n\t\t\tb_in_sum -= pb;\n\t\t\ta_in_sum -= pa;\n\n\t\t\tstackOut = stackOut.next;\n\n\t\t\tyi += width;\n\t\t}\n\t}\n\n\treturn imageData;\n}\n\nfunction greyscale (imageData) {\n\tvar len = imageData.data.length;\n\tvar brightness;\n\n\tfor ( var i = 0; i < len; i += 4 ) {\n\t\tbrightness = 0.34 * imageData.data[i] + 0.5 * imageData.data[i + 1] + 0.16 * imageData.data[i + 2];\n\n\t\timageData.data[i] = brightness;\n\t\timageData.data[i + 1] = brightness;\n\t\timageData.data[i + 2] = brightness;\n\t}\n\t\t\n\treturn imageData;\n}\n\n// most parts taken from http://jsdo.it/akm2/xoYx\n// (starting line 293++)\nfunction getEdgePoints ( imageData, threshold ) {\n\t// only check every 2nd pixel in imageData to save some time.\n\tvar multiplier = 2;\n\tvar width = imageData.width;\n\tvar height = imageData.height;\n\tvar data = imageData.data;\n\tvar points = [ ];\n\tvar x, y, row, col, sx, sy, step, sum, total;\n\n\tfor ( y = 0; y < height; y += multiplier ) {\n\t\tfor ( x = 0; x < width; x += multiplier ) {\n\t\t\tsum = total = 0;\n\n\t\t\tfor ( row = -1; row <= 1; row++ ) {\n\t\t\t\tsy = y + row;\n\t\t\t\tstep = sy * width;\n\n\t\t\t\tif ( sy >= 0 && sy < height ) {\n\t\t\t\t\tfor ( col = -1; col <= 1; col++ ) {\n\t\t\t\t\t\tsx = x + col;\n\n\t\t\t\t\t\tif ( sx >= 0 && sx < width ) {\n\t\t\t\t\t\t\tsum += data[( sx + step ) << 2];\n\t\t\t\t\t\t\ttotal++;\n\t\t\t\t\t\t}\n\t\t\t\t\t}\n\t\t\t\t}\n\t\t\t}\n\n\t\t\tif ( total ) {\n\t\t\t\tsum /= total;\n\t\t\t}\n\n\t\t\tif ( sum > threshold ) {\n\t\t\t\tpoints.push( { x: x, y: y } );\n\t\t\t}\n\t\t}\n\t}\n\n\treturn points;\n}\n\nfunction clamp ( value, min, max ) {\n\treturn value < min ? min : value > max ? max : value;\n}\n\nfunction addVertex ( x, y, hash ) {\n\tvar resultKey = x + '|' + y;\n\n\tif ( ! hash[resultKey] ) {\n\t\thash[resultKey] = { x: x, y: y };\n\t}\n\n\tresultKey = null;\n}\n\nfunction getVerticesFromPoints ( points, maxPointCount, accuracy, width, height ) {\n\t// using hash for all points to make sure we have a set of unique vertices.\n\tvar resultHash = { };\n\n\t// use 25% of max point count to create a background grid.\n\t// this avoids having too many \"big\" triangles in areas of the image with low contrast \n\t// next to very small ones in areas with high contrast\n\t// for every other row, start the x value at > 0, so the grid doesn't look too regular\n\tvar gridPointCount = Math.max( ~~( maxPointCount * ( 1 - accuracy ) ), 5 );\n\n\t// http://stackoverflow.com/a/4107092/229189\n\tvar gridColumns = Math.round( Math.sqrt( gridPointCount ) );\n\tvar gridRows = Math.round( Math.ceil( gridPointCount / gridColumns ) );\n\t\n\tvar xIncrement = ~~( width / gridColumns );\n\tvar yIncrement = ~~( height / gridRows );\n\n\tvar rowIndex = 0;\n\tvar startX = 0;\n\n\tvar x = 0;\n\tvar y = 0;\n\n\tfor ( y = 0; y < height; y+= yIncrement ) {\n\t\trowIndex++;\n\n\t\tstartX = rowIndex % 2 === 0 ? ~~( xIncrement / 2 ) : 0; \n\n\t\tfor ( x = startX; x < width; x += xIncrement ) {\n\t\t\tif ( x < width && y < height ) {\n\t\t\t\t// \"distorting\" the grid a little bit so that the\n\t\t\t\t// background vertices don't appear to be on a straight line (which looks boring)\n\t\t\t\taddVertex(\n\t\t\t\t\t~~( x + ( Math.cos( y ) * ( yIncrement ) ) ),\n\t\t\t\t\t~~( y + ( Math.sin( x ) * ( xIncrement ) ) ),\n\t\t\t\t\tresultHash\n\t\t\t\t);\n\t\t\t}\n\t\t}\n\t}\n\t\n\t// add points in the corners\n\taddVertex( 0, 0, resultHash );\n\taddVertex( width - 1, 0, resultHash );\n\taddVertex( width - 1, height - 1, resultHash );\n\taddVertex( 0, height - 1, resultHash );\n\n\t// add points from all edge points\n\tvar remainingPointCount = maxPointCount - Object.keys( resultHash ).length;\n\tvar edgePointCount = points.length;\n\tvar increment = ~~( edgePointCount / remainingPointCount );\n\n\tif ( maxPointCount > 0 && increment > 0 ) {\n\t\tvar i = 0;\n\n\t\tfor ( i = 0; i < edgePointCount; i += increment ) {\n\t\t\taddVertex( points[i].x, points[i].y, resultHash );\n\t\t}\n\t}\n\n\tpoints = null;\n\n\treturn Object.keys( resultHash ).map( function (key) {\n\t\treturn resultHash[key];\n\t} );\n}\n\nfunction getBoundingBox (points) {\n\tvar xMin = Infinity;\n\tvar xMax = -Infinity;\n\tvar yMin = Infinity;\n\tvar yMax = -Infinity;\n\n\tpoints.forEach( function (p) {\n\t\tif ( p.x < xMin ) {\n\t\t\txMin = p.x;\n\t\t}\n\n\t\tif ( p.y < yMin ) {\n\t\t\tyMin = p.y;\n\t\t}\n\n\t\tif ( p.x > xMax ) {\n\t\t\txMax = p.x;\n\t\t}\n\n\t\tif ( p.y > yMax ) {\n\t\t\tyMax = p.y;\n\t\t}\n\t} );\n\n\treturn {\n\t\tx: xMin,\n\t\ty: yMin,\n\t\twidth: xMax - xMin,\n\t\theight: yMax - yMin\n\t};\n}\n\nfunction addBoundingBoxesToPolygons ( polygons, colorData, params ) {\n\tpolygons.forEach( function (polygon) {\n\t\tpolygon.boundingBox = getBoundingBox( [ polygon.a, polygon.b, polygon.c ] );\n\t} );\n\n\treturn polygons.filter( function (polygon) {\n\t\treturn polygon.boundingBox.width > 0 && polygon.boundingBox.height > 0;\n\t} );\n}\n\n/**\n * Get color object by position\n * @param  {Object} pos         {x,y} object\n * @param  {Object} colorData   Image color data object\n * @param  {Object} [transparentColor] (optional) RGBA color object. Used to set specific color to transparent pixels\n * @return {Object}             RGBA color object\n */\nfunction getColorByPos ( pos, colorData, transparentColor ) {\n\tvar x = clamp( pos.x, 1, colorData.width - 2 );\n\tvar y = clamp( pos.y, 1, colorData.height - 2 );\n\tvar index = ( ( x | 0 ) + ( y | 0 ) * colorData.width ) << 2;\n\n\tif ( index >= colorData.data.length ) {\n\t\tindex = colorData.data.length - 5;\n\t}\n\n\tvar alpha = colorData.data[index + 3] / 255;\n\n\t// Return RGBA color object\n\treturn ( transparentColor && alpha === 0 ) ? transparentColor : {\n\t\tr: colorData.data[index],\n\t\tg: colorData.data[index + 1],\n\t\tb: colorData.data[index + 2],\n\t\ta: alpha\n\t};\n}\n\n/**\n * Get polygon's center point\n * @param  {Object} polygon Polygon object\n * @return {Object}         Point coordinates {x,y}\n */\nfunction polygonCenter (polygon) {\n\treturn {\n\t\tx: ( polygon.a.x + polygon.b.x + polygon.c.x ) * 0.33333,\n\t\ty: ( polygon.a.y + polygon.b.y + polygon.c.y ) * 0.33333\n\t};\n}\n\n/**\n * Is color transparent ?\n * @param  {Object} color Color object\n * @return {Boolean}      Is transparent?\n */\nfunction isTransparent (color) {\n\treturn color.a === 0;\n}\n\n/*\nobject-assign\n(c) Sindre Sorhus\n@license MIT\n*/\n/* eslint-disable no-unused-vars */\nvar getOwnPropertySymbols = Object.getOwnPropertySymbols;\nvar hasOwnProperty = Object.prototype.hasOwnProperty;\nvar propIsEnumerable = Object.prototype.propertyIsEnumerable;\n\nfunction toObject(val) {\n\tif (val === null || val === undefined) {\n\t\tthrow new TypeError('Object.assign cannot be called with null or undefined');\n\t}\n\n\treturn Object(val);\n}\n\nfunction shouldUseNative() {\n\ttry {\n\t\tif (!Object.assign) {\n\t\t\treturn false;\n\t\t}\n\n\t\t// Detect buggy property enumeration order in older V8 versions.\n\n\t\t// https://bugs.chromium.org/p/v8/issues/detail?id=4118\n\t\tvar test1 = new String('abc');  // eslint-disable-line no-new-wrappers\n\t\ttest1[5] = 'de';\n\t\tif (Object.getOwnPropertyNames(test1)[0] === '5') {\n\t\t\treturn false;\n\t\t}\n\n\t\t// https://bugs.chromium.org/p/v8/issues/detail?id=3056\n\t\tvar test2 = {};\n\t\tfor (var i = 0; i < 10; i++) {\n\t\t\ttest2['_' + String.fromCharCode(i)] = i;\n\t\t}\n\t\tvar order2 = Object.getOwnPropertyNames(test2).map(function (n) {\n\t\t\treturn test2[n];\n\t\t});\n\t\tif (order2.join('') !== '0123456789') {\n\t\t\treturn false;\n\t\t}\n\n\t\t// https://bugs.chromium.org/p/v8/issues/detail?id=3056\n\t\tvar test3 = {};\n\t\t'abcdefghijklmnopqrst'.split('').forEach(function (letter) {\n\t\t\ttest3[letter] = letter;\n\t\t});\n\t\tif (Object.keys(Object.assign({}, test3)).join('') !==\n\t\t\t\t'abcdefghijklmnopqrst') {\n\t\t\treturn false;\n\t\t}\n\n\t\treturn true;\n\t} catch (err) {\n\t\t// We don't expect any of the above to throw, but better to be safe.\n\t\treturn false;\n\t}\n}\n\nvar objectAssign = shouldUseNative() ? Object.assign : function (target, source) {\n\tvar arguments$1 = arguments;\n\n\tvar from;\n\tvar to = toObject(target);\n\tvar symbols;\n\n\tfor (var s = 1; s < arguments.length; s++) {\n\t\tfrom = Object(arguments$1[s]);\n\n\t\tfor (var key in from) {\n\t\t\tif (hasOwnProperty.call(from, key)) {\n\t\t\t\tto[key] = from[key];\n\t\t\t}\n\t\t}\n\n\t\tif (getOwnPropertySymbols) {\n\t\t\tsymbols = getOwnPropertySymbols(from);\n\t\t\tfor (var i = 0; i < symbols.length; i++) {\n\t\t\t\tif (propIsEnumerable.call(from, symbols[i])) {\n\t\t\t\t\tto[symbols[i]] = from[symbols[i]];\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t}\n\n\treturn to;\n};\n\n// import objectAssign from 'object-assign'\n\n// https://gist.githubusercontent.com/oriadam/396a4beaaad465ca921618f2f2444d49/raw/76b0de6caffaac59f8af2b4dfa0e0b6397cf447d/colorValues.js\n// return array of [r,g,b,a] from any valid color. if failed returns undefined\nfunction strToColorArr ( color ) {\n\tif ( typeof color === 'string' ) {\n\t\tvar result = [ 0, 0, 0, 0 ];\n\t\t\n\t\tif ( color[0] === '#' )\t{\n\t\t\t// convert #RGB and #RGBA to #RRGGBB and #RRGGBBAA\n\t\t\tif ( color.length < 7 ) {\n\t\t\t\tcolor = \"#\" + (color[1]) + (color[1]) + (color[2]) + (color[2]) + (color[3]) + (color[3]) + (color.length > 4 ? color[4] + color[4] : '');\n\t\t\t}\n\n\t\t\tresult = [\n\t\t\t\tparseInt(color.substr( 1, 2 ), 16),\n\t\t\t\tparseInt(color.substr( 3, 2 ), 16),\n\t\t\t\tparseInt(color.substr( 5, 2 ), 16),\n\t\t\t\tcolor.length > 7 ? parseInt( color.substr( 7, 2 ), 16 ) / 255 : 1\n\t\t\t];\n\t\t}\n\n\t\tif ( color.indexOf('rgb') === 0 ) {\n\t\t\t// convert 'rgb(R,G,B)' to 'rgb(R,G,B)A' which looks awful but will pass the regxep below\n\t\t\tif ( ! color.includes( 'rgba' ) ) {\n\t\t\t\tcolor += ',1';\n\t\t\t}\n\n\t\t\tresult = color\n\t\t\t\t.match( /[\\.\\d]+/g )\n\t\t\t\t.map( function (a) { return +a; } );\n\t\t}\n\t\t\n\t\treturn result;\n\t} else {\n\t\treturn;\n\t}\n\n}\n\nfunction strToColor ( str ) {\n\tvar color = strToColorArr( str );\n\n\tif ( color ) {\n\t\tvar r = color[0];\n\t\tvar g = color[1];\n\t\tvar b = color[2];\n\t\tvar a = color[3];\n\t\treturn { r: r, g: g, b: b, a: a };\n\t} else {\n\t\treturn;\n\t}\n}\n\nfunction addColorToPolygons ( polygons, colorData, params ) {\n\tvar fill = params.fill;\n\tvar stroke = params.stroke;\n\tvar strokeWidth = params.strokeWidth;\n\tvar lineJoin = params.lineJoin;\n\tvar transparentColor = params.transparentColor;\n\tvar fillColor = fill ? strToColor( fill ) : false;\n\tvar strokeColor = stroke ? strToColor( stroke ) : false;\n\n\t/**\n\t * Color override logic\n\t * @param  {Object} color    Color object\n\t * @param  {String} override Override color (fillColor/strokeColor)\n\t * @return {String}          CSS formatted color (rgba,..)\n\t */\n\tvar getColor = function ( color, override ) {\n\t\tvar t = ( isTransparent( color ) && transparentColor );\t// Color is transparent, and transparentColor override is defined\n\t\tvar c = t ? transparentColor : color;\n\t\treturn ( override && !t ) ? override : c;\t\t// Priority: transparentColor -> override -> supplied color\n\t};\n\n\tpolygons.forEach( function (polygon) {\n\t\tvar color = getColorByPos( polygonCenter( polygon ), colorData );\n\n\t\tif ( fill ) {\n\t\t\tpolygon.fill = getColor( color, fillColor );\n\t\t}\n\n\t\tif ( stroke ) {\n\t\t\tpolygon.strokeColor = getColor(color, strokeColor);\n\t\t\tpolygon.strokeWidth = strokeWidth;\n\t\t\tpolygon.lineJoin = lineJoin;\n\t\t}\n\t} );\n\n\treturn polygons;\n}\n\n//  http://stackoverflow.com/a/9733420/229189\nfunction luminance (color) {\n\tvar a = [ color.r, color.g, color.b ].map( function (v) {\n\t\tv /= 255;\n\t\treturn ( v <= 0.03928 ) ? v / 12.92 : Math.pow( ( ( v + 0.055 ) / 1.055 ), 2.4 );\n\t} );\n\n\treturn a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;\n}\n\nfunction distance ( a, b ) {\n\tvar dx = b.x - a.x;\n\tvar dy = b.y - a.y;\n\n\treturn Math.sqrt( ( dx * dx ) + ( dy * dy ) );\n}\n\nfunction addGradientsToPolygons ( polygons, colorData, params ) {\n\tpolygons.forEach( function (polygon) {\n\t\tvar data = { };\n\n\t\t'abc'.split( '' ).forEach( function (key) {\n\t\t\tvar color = getColorByPos( polygon[key], colorData, params.transparentColor );\n\t\t\t\n\t\t\tdata[key] = {\n\t\t\t\tkey: key,\n\t\t\t\tcolor: color,\n\t\t\t\tx: polygon[key].x,\n\t\t\t\ty: polygon[key].y\n\t\t\t};\n\n\t\t\tdata[key].luminance = luminance( data[key].color );\n\n\t\t\tvar otherKeys = 'abc'.replace( key, '' ).split( '' );\n\n\t\t\tdata[key].median = {\n\t\t\t\tx: ( polygon[otherKeys[0]].x + polygon[otherKeys[1]].x ) / 2,\n\t\t\t\ty: ( polygon[otherKeys[0]].y + polygon[otherKeys[1]].y ) / 2\n\t\t\t};\n\n\t\t\tdata[key].medianColor = getColorByPos( data[key].median, colorData, params.transparentColor );\n\t\t\tdata[key].medianLuminance = luminance( data[key].medianColor );\n\t\t} );\n\n\t\t// sort by axis of most difference in luminance\n\t\tvar pointsByDeltaInLuminance = [ data.a, data.b, data.c ].sort( function ( u, v ) {\n\t\t\treturn Math.abs( u.luminance - u.medianLuminance ) - Math.abs( v.luminance - v.medianLuminance );\n\t\t} );\n\n\t\tvar pointWithMostDeltaInLuminance = pointsByDeltaInLuminance[0];\n\t\tvar startPoint = pointsByDeltaInLuminance[0];\n\t\tvar endPoint = pointWithMostDeltaInLuminance.median;\n\n\t\tvar gradienStopPositions = [ startPoint ];\n\n\t\tvar startToEndDistance = distance( startPoint, endPoint );\n\n\t\tfor ( var i = 1, len = params.gradientStops - 2; i < len; i++ ) {\n\t\t\tvar pointDistance = i * ( startToEndDistance / params.gradientStops );\n\t\t\tvar pointPercent = pointDistance / startToEndDistance;\n\t\t\t\n\t\t\tvar point = {\n\t\t\t\tx: startPoint.x + pointPercent * ( endPoint.x - startPoint.x ), \n\t\t\t\ty: startPoint.y + pointPercent * ( endPoint.y - startPoint.y )\n\t\t\t};\n\n\t\t\tgradienStopPositions.push( point );\n\t\t}\n\n\t\tgradienStopPositions.push( endPoint );\n\n\t\tpolygon.gradient = {\n\t\t\tx1: pointWithMostDeltaInLuminance.x,\n\t\t\ty1: pointWithMostDeltaInLuminance.y,\n\t\t\tx2: pointWithMostDeltaInLuminance.median.x,\n\t\t\ty2: pointWithMostDeltaInLuminance.median.y,\n\t\t\tcolors: gradienStopPositions.map( function (pos) {\n\t\t\t\treturn getColorByPos( pos, colorData, params.transparentColor );\n\t\t\t} )\n\t\t};\n\n\t\tif ( params.stroke ) {\n\t\t\tpolygon.strokeWidth = params.strokeWidth;\n\t\t\tpolygon.lineJoin = params.lineJoin;\n\t\t}\n\n\t\tdata = null;\n\t} );\n\n\treturn polygons;\n}\n\n/**\n * Filter polygons with transparent color\n * @param  {Array} polygons    Polygons array\n * @param  {Object} colorData  Color data\n * @return {Array}             Filtered polygons array\n */\nfunction filterTransparentPolygons ( polygons, colorData ) {\n\treturn polygons.filter( function (polygon) {\n\t\tvar color = getColorByPos( polygonCenter( polygon ), colorData );\n\t\treturn ! isTransparent( color );\n\t});\n}\n\nfunction imageDataToPolygons ( imageData, params ) {\n\tif ( isImageData( imageData ) ) {\n\t\tvar imageSize = { width: imageData.width, height: imageData.height };\n\t\tvar tmpImageData = copyImageData( imageData );\n\t\tvar colorImageData = copyImageData( imageData );\n\t\tvar blurredImageData = stackblur( tmpImageData, 0, 0, imageSize.width, imageSize.height, params.blur );\n\t\tvar greyscaleImageData = greyscale( blurredImageData );\n\t\tvar edgesImageData = sobel( greyscaleImageData ).toImageData();\n\t\tvar edgePoints = getEdgePoints( edgesImageData, params.threshold );\n\t\tvar edgeVertices = getVerticesFromPoints( edgePoints, params.vertexCount, params.accuracy, imageSize.width, imageSize.height );\n\t\tvar polygons = delaunay_2( edgeVertices );\n\t\t\n\t\tpolygons = addBoundingBoxesToPolygons( polygons );\n\t\t\n\t\tif ( ! params.transparentColor ) {\n\t\t\tpolygons = filterTransparentPolygons( polygons, colorImageData );\n\t\t}\n\t\t\n\t\tif ( params.fill === true && params.gradients === true ) {\n\t\t\tpolygons = addGradientsToPolygons( polygons, colorImageData, params );\n\t\t} else {\n\t\t\tpolygons = addColorToPolygons( polygons, colorImageData, params );\n\t\t}\n\n\t\treturn polygons;\n\t} else {\n\t\tthrow new Error( \"Can't work with the imageData provided. It seems to be corrupt.\" );\n\t\treturn;\n\t}\n}\n\nonmessage = function (msg) {\n\tif ( msg.data.imageData && msg.data.params ) {\n\t\ttry {\n\t\t\tvar imageData = msg.data.imageData;\n\n\t\t\t// phantomjs seems to have some memory loss so we need to make sure\n\t\t\tif ( typeof imageData.width === 'undefined' && typeof msg.data.imageDataWidth === 'number' ) {\n\t\t\t\timageData.width = msg.data.imageDataWidth;\n\t\t\t}\n\n\t\t\tif ( typeof imageData.height === 'undefined' && typeof msg.data.imageDataHeight === 'number' ) {\n\t\t\t\timageData.height = msg.data.imageDataHeight;\n\t\t\t}\n\t\t\t\n\t\t\tvar polygons = imageDataToPolygons( msg.data.imageData, msg.data.params );\n\t\t\t\t\t\t\n\t\t\tself.postMessage( {\n\t\t\t\tpolygonJSONStr: JSON.stringify( polygons )\n\t\t\t} );\n\t\t} catch ( err ) {\n\t\t\tself.postMessage( { err: err.message || err } );\n\t\t}\n\n\t} else {\n\t\tif ( msg.data.imageData ) {\n\t\t\tself.postMessage( { err: 'Parameters are missing.' } );\n\t\t} else {\n\t\t\tself.postMessage( { err: 'ImageData is missing.' } );\n\t\t}\n\t}\n\t\n\tself.close();\n};\n"],{type:'text/javascript'})) );

		var inputFn;
		var outputFn;
		
		var api = {
			getParams: getParams,
			getInput: getInput,
			getOutput: getOutput
		};

		var inputMethods = {
			fromImage: fromImage,
			fromImageSync: fromImageSync,
			fromImageData: fromImageData,
			fromImageDataSync: fromImageDataSync
		};

		var outputMethods = {
			toData: toData,
			toDataSync: toDataSync,
			toDataURL: toDataURL,
			toDataURLSync: toDataURLSync,
			toImageData: toImageData,
			toImageDataSync: toImageDataSync,
			toSVG: toSVG,
			toSVGSync: toSVGSync
		};

		function getParams () {
			return params;
		}

		function getInput () {
			var result = objectAssign( { }, api );

			if ( ! inputFn ) {
				objectAssign( result, inputMethods );
			}

			return result;
		}

		function getOutput () {
			var result = objectAssign( { }, api );

			if ( ! outputFn ) {
				objectAssign( result, outputMethods );
			}

			return result;
		}

		function fromImage ( inputParams ) { return setInput( fromImageToImageData, inputParams ); }
		function fromImageSync ( inputParams ) { return setInput( fromImageToImageData, inputParams, true ); }
		function fromImageData ( inputParams ) { return setInput( function (i) { return i; }, inputParams ); }
		function fromImageDataSync ( inputParams ) { return setInput( function (i) { return i; }, inputParams, true ); }

		function toData ( outputParams ) { return setOutput( function (i) { return i; }, outputParams ); }
		function toDataSync ( outputParams ) { return setOutput( function (i) { return i; }, outputParams, true ); }
		function toDataURL ( outputParams ) { return setOutput( polygonsToDataURL, outputParams ); }
		function toDataURLSync ( outputParams ) { return setOutput( polygonsToDataURL, outputParams, true ); }
		function toImageData ( outputParams ) { return setOutput( polygonsToImageData, outputParams ); }
		function toImageDataSync ( outputParams ) { return setOutput( polygonsToImageData, outputParams, true ); }
		function toSVG ( outputParams ) { return setOutput( polygonsToSVG, outputParams ); }
		function toSVGSync ( outputParams ) { return setOutput( polygonsToSVG, outputParams, true ); }

		function setInput ( fn, inputParams, isSync ) {
			isInputSync = !! isSync;
			
			inputFn = function () {
				if ( isInputSync ) {
					return fn( inputParams );
				} else {
					return new Promise( function ( resolve, reject ) {
						try {
							var imageData = fn( inputParams );
							resolve( imageData );
						} catch ( err ) {
							reject( err );
						}
					} );
				}
			};

			if ( isReady() ) {
				return getResult();
			} else {
				return getOutput();
			}
		}

		function setOutput ( fn, outputpParams, isSync ) {
			isOutputSync = !! isSync;

			outputFn = function ( polygons, size ) {
				if ( isOutputSync ) {
					return fn( polygons, size, outputpParams );
				} else {
					return new Promise( function ( resolve, reject ) {
						try {
							var outputData = fn( polygons, size, outputpParams );
							resolve( outputData );
						} catch ( err ) {
							reject( err );
						}
					} );
				}
			};

			if ( isReady() ) {
				return getResult();
			} else {
				return getInput();
			}
		}

		function isReady () {
			return inputFn && outputFn;
		}

		function getResult () {
			if ( isInputSync && isOutputSync ) {
				var imageData = inputFn( params );
				var polygonData = imageDataToPolygons( imageData, params );
				var outputData = outputFn( polygonData, imageData );

				return outputData;
			} else {
				return new Promise( function ( resolve, reject ) {
					var imageData;
					
					makeInput()
						.then( function (imgData) {
							imageData = imgData;
							return makePolygonsInWorker( imageData, params );
						}, reject )
						.then( function (polygonData) {
							return makeOutput( polygonData, imageData );
						}, reject )
						.then( function (outputData) {
							resolve( outputData );
						}, reject );
				} );
			}
		}

		function makeInput ( inputParams ) {
			return new Promise( function ( resolve, reject ) {
				if ( isInputSync ) {
					try {
						var imageData = inputFn( inputParams );
						resolve( imageData );
					} catch ( err ) {
						reject( err );
					}
				} else {
					inputFn( inputParams )
						.then( resolve, reject );
				}
			} );
		}

		function makePolygonsInWorker ( imageData, params ) {
			return new Promise( function ( resolve, reject ) {
				worker.addEventListener( 'message', function (event) {
					if ( event.data && event.data.polygonJSONStr ) {
						var polygonData = JSON.parse( event.data.polygonJSONStr );
						
						resolve( polygonData );
					} else {
						if ( event.data && event.data.err ) {
							reject( event.data.err );
						} else {
							reject( event );
						}
					}
				} );

				worker.postMessage( {
					params: params,
					imageData: imageData,
					// phantomjs tends to forget about those two
					// so we send them separately
					imageDataWidth: imageData.width,
					imageDataHeight: imageData.height
				} );
			} );
		}

		function makeOutput ( polygonData, imageData ) {
			return new Promise( function ( resolve, reject ) {
				if ( isOutputSync ) {
					try {
						var outputData = outputFn( polygonData, imageData );
						resolve( outputData );
					} catch ( e ) {
						reject( e );
					}
				} else {
					outputFn( polygonData, imageData )
						.then( resolve, reject );
				}
			} );
		}

		return getInput();
	}

	return browser;

}));
