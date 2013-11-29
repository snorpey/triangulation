/*global define*/
define(
	function()
	{
		var signals;
		var export_button;
		var png_link;
		var svg_link;

		function init( shared )
		{
			signals = shared.signals;
			export_button = document.getElementById( 'export-button' );
			png_link = document.getElementById( 'png-link' );
			svg_link = document.getElementById( 'svg-link' );

			export_button.addEventListener( 'click', exportButtonClicked, false );
			png_link.addEventListener( 'click', hidePNGLink, false );
			svg_link.addEventListener( 'click', hideSVGLink, false );
		}

		function exportButtonClicked( event )
		{
			event.preventDefault();

			signals['export-requested'].dispatch( upldateLinkAddresses );
		}

		function upldateLinkAddresses( data )
		{
			png_link.href = data.png;
			png_link.classList.add( 'is-active' );

			var svg_string = getSVG( data.svg.triangles, data.svg.size );
			var blob = new Blob( [ svg_string ], { type: 'image/svg+xml' } );
			var svg_url = window.URL.createObjectURL( blob );

			svg_link.href = svg_url;
			svg_link.classList.add( 'is-active' );
		}

		function hidePNGLink()
		{
			png_link.classList.remove( 'is-active' );
		}

		function hideSVGLink()
		{
			svg_link.classList.remove( 'is-active' );
		}

		// http://stackoverflow.com/questions/6918597/convert-canvas-or-control-points-to-svg
		// https://developer.mozilla.org/en-US/docs/SVG/Element/polygon
		function getSVG( triangles, size )
		{
			var triangle_keys = [ 'a', 'b', 'c' ];
			var svg = '';

			svg += '<?xml version="1.0" standalone="yes"?>';
			svg += '<svg ';
			svg += 'width="' + size.width + 'px" ';
			svg += 'height="' + size.height + 'px" ';
			svg += 'xmlns="http://www.w3.org/2000/svg" version="1.1">';

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