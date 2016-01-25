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

			var blob = new Blob( [ data.svg ], { type: 'image/svg+xml' } );
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

		return { init: init };
	}
);