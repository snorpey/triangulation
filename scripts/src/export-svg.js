/*global define*/
define(
	function()
	{
		var signals;
		var triangle_keys = [ 'a', 'b', 'c' ];
		var svg_button;

		function init( shared )
		{
			signals = shared.signals;

			if ( shared.feature['file-api' ] )
			{
				signals['export-svg'].add( generateSVG );
				signals['control-updated'].add( hideLink );

				svg_button = document.getElementById( 'svg-button' );

				svg_button.addEventListener( 'click', hideLink, false );
			}
		}

		function generateSVG( data )
		{
			var svg = getSVG( data.triangles, data.size );
			var blob = new Blob( [ svg ], { type: 'image/svg+xml' } );
			var url = window.URL.createObjectURL( blob );

			svg_button.href = url;
			svg_button.classList.add( 'is-active' );
		}

		function hideLink()
		{
			svg_button.classList.remove( 'is-active' );
		}

		// http://stackoverflow.com/questions/6918597/convert-canvas-or-control-points-to-svg
		// https://developer.mozilla.org/en-US/docs/SVG/Element/polygon
		function getSVG( triangles, size )
		{
			var svg = '';
			svg += '<?xml version="1.0" standalone="yes"?>';
			svg += '<svg width="' + size.width + 'px" height="' + size.height + 'px" xmlns="http://www.w3.org/2000/svg" version="1.1">';

			for ( var i = 0; i < triangles.length; i++ )
			{
				var triangle = triangles[i];
				var points = [ ];

				for ( var j = 0; j < triangle_keys.length; j++ )
				{
					var key = triangle_keys[j];
					points[j] = triangle[key].x + ',' + triangle[key].y;
				}

				svg += '<polygon ';
				svg += 'points="' + points.join( ' ' ) + '" ';
				svg += 'fill="' + triangle.color + '" ';
				svg += '/>';
			}

			svg += '</svg>';

			return svg;
		}

		return { init: init };
	}
);