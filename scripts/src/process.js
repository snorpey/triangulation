/*global define*/
define(
	[
		'lib/superfast-blur.0.5',
		'lib/delaunay',
		'util/detect-edges',
		'util/get-edge-points',
		'util/get-random-vertices',
		'util/greyscale'
	],
	function( blur, triangulate, detectEdges, getEdgePoints, getRandomVertices, greyscale )
	{
		var tmp_canvas = document.createElement( 'canvas' );
		var tmp_ctx = tmp_canvas.getContext( '2d' );

		var canvas = document.getElementById( 'canvas' );
		var ctx = canvas.getContext( '2d' );

		var is_processing = false;
		var values;
		var image;
		var signals;

		var triangles;
		var triangle;

		var image_data;
		var color_data;
		var blurred_image_data;
		var greyscale_data;
		var edge_image_data;
		var edge_points;
		var edge_vertices;
		var polygons;

		var len;
		var i;

		var triangle_center_x, triangle_center_y, pixel;

		var pxratio = ( window.devicePixelRatio && window.devicePixelRatio > 1 ) ? window.devicePixelRatio : 1;

		function init( shared )
		{
			signals = shared.signals;

			signals['image-loaded'].add( generate );
			signals['control-updated'].add( controlsUpdated );
			signals['export-requested'].add( exportData );
		}

		function controlsUpdated( new_values )
		{
			values = getAdjustedValues( new_values );

			update();
		}

		function generate( img )
		{
			if ( ! is_processing )
			{
				image = img;
				processImage( image );
			}
		}

		function update()
		{
			if ( ! is_processing && image )
			{
				processImage( image );
			}
		}

		function processImage( img )
		{
			is_processing = true;

			clearCanvas( tmp_canvas, tmp_ctx );
			clearCanvas( canvas, ctx );

			resizeCanvas( tmp_canvas, img, pxratio );
			resizeCanvas( canvas, img, pxratio );

			tmp_ctx.drawImage( img, 0, 0 );

			// get the image data
			image_data         = tmp_ctx.getImageData( 0, 0, tmp_canvas.width, tmp_canvas.height );

			// since the image data is blurred and greyscaled later on,
			// we need another copy of the image data with preserved colors
			color_data         = tmp_ctx.getImageData( 0, 0, tmp_canvas.width, tmp_canvas.height );

			// blur the imagedata using superfast blur by @quasimondo
			// not very accurate, but fast
			blurred_image_data = blur( image_data, values.blur, false );

			greyscale_data     = greyscale( image_data );
			edge_image_data    = detectEdges( greyscale_data, values.accuracy, 5 );

			// gets some of the edge points to construct triangles
			edge_points        = getEdgePoints( edge_image_data, 50, values.accuracy );
			edge_vertices      = getRandomVertices( edge_points, values['point-rate'], values['point-count'], values.accuracy, tmp_canvas.width, tmp_canvas.height );

			// makes triangles out of points
			polygons           = triangulate( edge_vertices );

			// get the color for every triangle
			triangles          = getColorfulTriangles( polygons, color_data );

			drawTriangles( ctx, triangles );

			is_processing = false;
		}

		function drawTriangles( ctx, triangles )
		{
			len = triangles.length;

			for ( i = 0; i < len; i++ )
			{
				triangle = triangles[i];

				ctx.beginPath();
				ctx.moveTo( triangle.a.x * pxratio, triangle.a.y * pxratio );
				ctx.lineTo( triangle.b.x * pxratio, triangle.b.y * pxratio );
				ctx.lineTo( triangle.c.x * pxratio, triangle.c.y * pxratio );
				ctx.lineTo( triangle.a.x * pxratio, triangle.a.y * pxratio );

				ctx.fillStyle = triangle.color;
				ctx.fill();
				ctx.closePath();
			}
		}

		function resizeCanvas( canvas, img, ratio )
		{
			canvas.width = img.width * ratio;
			canvas.height = img.height * ratio;

			canvas.style.width = ( canvas.width / ratio ) + 'px';
			canvas.style.height = ( canvas.height / ratio ) + 'px';
		}

		function clearCanvas( canvas, ctx )
		{
			ctx.clearRect( ctx, 0, 0, canvas.width, canvas.height );
		}

		function exportData( callback )
		{
			if ( typeof callback === 'function' )
			{
				var export_data = {
					png: canvas.toDataURL( 'image/png' ),
					svg: {
						triangles: triangles,
						size : { width: canvas.width / pxratio, height: canvas.height / pxratio }
					}
				};

				callback( export_data );
			}
		}

		function getColorfulTriangles( triangles, color_data )
		{
			len = triangles.length;

			for ( i = 0; i < len; i++ )
			{
				triangle = triangles[i];

				// triangle color = color at center of triangle
				triangle_center_x = ( triangle.a.x + triangle.b.x + triangle.c.x ) * 0.33333;
				triangle_center_y = ( triangle.a.y + triangle.b.y + triangle.c.y ) * 0.33333;

				pixel = ( ( triangle_center_x | 0 ) + ( triangle_center_y | 0 ) * color_data.width ) << 2;

				triangle.color = 'rgb(' + color_data.data[pixel] + ', ' + color_data.data[pixel + 1] + ', ' + color_data.data[pixel + 2] + ')';
			}

			return triangles;
		}

		function getAdjustedValues( new_values )
		{
			var result = { };

			for ( var key in new_values )
			{
				switch ( key )
				{
					case 'blur' :
						result[key] = parseInt( scaleRange( new_values[key], 0, 100, 0, 50 ), 10 );
						break;

					case 'accuracy' :
						result[key] = scaleRange( new_values[key], 0, 100, 1, 0.1 );
						break;

					case 'point-rate' :
						result[key] = scaleRange( new_values[key], 0, 100, 0.001, 0.1 );
						break;

					case 'point-count' :
						result[key] = parseInt( scaleRange( new_values[key], 0, 100, 100, 5000 ), 10 );
						break;
				}
			}

			return result;
		}

		function scaleRange( value, low_1, high_1, low_2, high_2 )
		{
			return low_2 + ( high_2 - low_2) * ( value - low_1 ) / (high_1 - low_1 );
		}

		return { init: init };
	}
);