/*global define*/
define(
	[
		'lib/superfast-blur.0.5',
		'lib/delaunay',
		'aux/detect-edges',
		'aux/get-edge-points',
		'aux/get-random-vertices',
		'aux/greyscale'
	],
	function( blur, triangulate, detectEdges, getEdgePoints, getRandomVertices, greyscale )
	{
		var tmp_canvas = document.createElement( 'canvas' );
		var tmp_ctx = tmp_canvas.getContext( '2d' );

		var canvas = document.getElementById( 'canvas' );
		var ctx = canvas.getContext( '2d' );

		var signals;
		var is_processing = false;

		function init( shared )
		{
			signals = shared.signals;

			signals[ 'image-loaded' ].add( generate );
		}

		function generate( img )
		{
			if ( ! is_processing )
			{
				processImage( img );
			}
		}

		function processImage( img )
		{
			is_processing = true;

			clearCanvas( tmp_canvas, tmp_ctx );
			clearCanvas( canvas, ctx );

			resizeCanvas( tmp_canvas, img );
			resizeCanvas( canvas, img );

			console.time( 'total' );
			tmp_ctx.drawImage( img, 0, 0 );

			var image_data = tmp_ctx.getImageData( 0, 0, tmp_canvas.width, tmp_canvas.height );
			var color_data = tmp_ctx.getImageData( 0, 0, tmp_canvas.width, tmp_canvas.height );

			console.time( 'blur' );
			var blurred_image_data = blur( image_data, 20, false );
			console.timeEnd( 'blur' );

			console.time( 'greyscale' );
			var greyscale_data = greyscale( image_data );
			console.timeEnd( 'greyscale' );

			console.time( 'detect edges' );
			var edge_image_data = detectEdges( greyscale_data, 5 );
			console.timeEnd( 'detect edges' );

			console.time( 'get edge points' );
			var edge_points = getEdgePoints( edge_image_data, 10 );
			console.timeEnd( 'get edge points' );

			console.time( 'get random points' );
			var edge_vertices = getRandomVertices( edge_points, 0.0045, 1500 );
			console.timeEnd( 'get random points' );

			console.time( 'delauney' );
			var triangles = triangulate( edge_vertices );
			console.timeEnd( 'delauney' );

			console.time( 'draw' );
			drawTriangles( ctx, triangles, color_data );
			console.timeEnd( 'draw' );
			console.timeEnd( 'total' );

			is_processing = false;
		}

		function drawTriangles( ctx, triangles, color_data )
		{
			var len = triangles.length;
			var i, triangle, triangle_center_x, triangle_center_y, color_data_index;

			for ( i = 0; i < len; i++ )
			{
				triangle = triangles[i];

				ctx.beginPath();
				ctx.moveTo( triangle.a.x, triangle.a.y );
				ctx.lineTo( triangle.b.x, triangle.b.y );
				ctx.lineTo( triangle.c.x, triangle.c.y );
				ctx.lineTo( triangle.a.x, triangle.a.y );

				// triangle color = color at center of triangle
				triangle_center_x = ( triangle.a.x + triangle.b.x + triangle.c.x ) * 0.33333;
				triangle_center_y = ( triangle.a.y + triangle.b.y + triangle.c.y ) * 0.33333;

				color_data_index = ( ( triangle_center_x | 0 ) + ( triangle_center_y | 0 ) * color_data.width ) << 2;

				ctx.fillStyle = 'rgb(' + color_data.data[color_data_index] + ', ' + color_data.data[color_data_index + 1] + ', ' + color_data.data[color_data_index + 2] + ')';
				ctx.fill();
				ctx.closePath();
			}
		}

		function resizeCanvas( canvas, img )
		{
			canvas.width = img.width;
			canvas.height = img.height;
		}

		function clearCanvas( canvas, ctx )
		{
			ctx.clearRect( ctx, 0, 0, canvas.width, canvas.height );
		}

		return { init: init };
	}
);