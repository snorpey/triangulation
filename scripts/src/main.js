/*global require, requirejs, define, Modernizr, _basepath_ */
// http://requirejs.org/docs/api.html#config 
var path = typeof _basepath_ === 'string' ? _basepath_ + '/' : '';
requirejs.config(
	{
		baseUrl: path + 'scripts/',
		waitSeconds: 5,
		urlArgs: 'bust=' +  ( new Date() ).getTime(),
		paths: {
			'signals'   : 'lib/signals-1.0.0'
		},
		shim: {
			'lib/delaunay': { exports: 'triangulate' }
		}
	}
);

require(
	[
		'src/process',
		'src/image',
		'src/ui',
		'signals'
	],
	function(
		process,
		image,
		ui,
		Signal
	)
	{
		var shared = {
			signals: {
				'image-loaded': new Signal(),
				'set-new-src' : new Signal()
			}
		};

		var signals = shared.signals;

		init();

		function init()
		{
			process.init( shared );
			ui.init( shared );
			image.init( shared );
		}
	}
);