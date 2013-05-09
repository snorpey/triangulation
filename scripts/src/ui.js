/*global define*/
define(
	function()
	{
		var signals;
		var reader;

		function init( shared )
		{
			reader = new FileReader();
			signals = shared.signals;

			document.addEventListener( 'drop', dropped, false );
			document.addEventListener( 'dragover', preventDefault, false );
			document.addEventListener( 'dragleave', preventDefault, false );

			reader.addEventListener( 'load', fileLoaded, false );
		}

		function preventDefault( event )
		{
			event.preventDefault();
		}

		function dropped( event )
		{
			event.preventDefault();
			reader.readAsDataURL( event.dataTransfer.files[0] );
		}

		function fileLoaded( event )
		{
			signals['set-new-src'].dispatch( event.target.result );
		}

		return { init: init };
	}
);