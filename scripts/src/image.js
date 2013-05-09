/*global define*/
define(
	function()
	{
		var signals;
		var image;
		var initialized = false;

		function init( shared )
		{
			signals = shared.signals;
			image = new Image();

			signals['set-new-src'].add( setSrc );

			image.addEventListener( 'load', imageLoaded, false );

			// gf: "bikes" by snorpey on flickr:
			// http://flickr.com/photos/snorpey/8700571753/sizes/z/in/photostream/
			setSrc( 'bikes.jpg' );
		}

		function imageLoaded()
		{
			signals['image-loaded'].dispatch( image );
			initialized = true;
		}

		function setSrc( src )
		{
			image.src = src;

			if (
				initialized &&
				image.naturalWidth !== undefined &&
				image.naturalWidth !== 0
			)
			{
				signals['image-loaded'].dispatch( image );
			}
		}

		return { init: init };
	}
);