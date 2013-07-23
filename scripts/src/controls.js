/*global define*/
define(
	function()
	{
		var values = { };
		var is_initialized = false;
		var signals;
		var timeout_id;

		function init( shared )
		{
			signals = shared.signals;

			if ( shared.feature['query-selector-all'] )
			{
				var wrapper = document.getElementById( 'controls' );
				var controls = document.querySelectorAll( '.control-input' );

				wrapper.className += ' is-active';

				for ( var i = 0; i < controls.length; i++ )
				{
					var control = controls[i];

					control.addEventListener( 'change', controlUpdated, false );
					updateValue( control.id, control.value );
				}

				is_initialized = true;

				signals['control-updated'].dispatch( values );
			}
		}

		function controlUpdated( event )
		{
			var target = event.target;

			clearTimeout( timeout_id );

			timeout_id = setTimeout(
				function()
				{
					updateValue( target.id, target.value );
				},
				200
			);
		}

		function updateValue( key, value )
		{
			values[key] = value;

			if ( is_initialized )
			{
				signals['control-updated'].dispatch( values );
			}
		}

		return { init: init };
	}
);