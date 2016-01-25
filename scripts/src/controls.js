/*global define*/
define(
	function()
	{
		var values = { };
		var is_initialized = false;
		var signals;
		var controls;
		var timeout_id;

		var is_blocked = false;

		function init( shared )
		{
			signals = shared.signals;

			if ( shared.feature['query-selector-all'] )
			{
				var wrapper = document.getElementById( 'controls' );
				controls = wrapper.querySelectorAll( '.control-input' );

				wrapper.className += ' is-active';

				for ( var i = 0; i < controls.length; i++ )
				{
					var control = controls[i];

					control.addEventListener( 'change', controlUpdated, false );

					updateValue( getInputKey( control.id ), getInputValue( control ) );
					updateInput( getCorrespondingInput( control.id ), getInputValue( control ) );
				}

				is_initialized = true;

				signals['control-set'].add( setControlValues );
				signals['control-updated'].dispatch( values );
			}
		}

		function controlUpdated( element )
		{
			clearTimeout( timeout_id );
			
			timeout_id = setTimeout(
				function()
				{
					if ( element.target )
					{
						element = element.target;
					}

					updateValue( getInputKey( element.id ), getInputValue( element ) );
					updateInput( getCorrespondingInput( element.id ), getInputValue( element ) );
				},
				100
			);
		}

		function setControlValues( new_values )
		{
			var control;
			var updated_values = { };

			for ( var id in new_values )
			{
				control = getCorrespondingInput( id );
				setInputValue( control, new_values[id] );
				controlUpdated( control );
				updated_values[ getInputKey( id ) ] = new_values[id];
			}

			values = updated_values;
			signals['control-updated'].dispatch( values );
		}

		function updateValue( key, value )
		{
			if ( typeof value !== 'undefined' ) {
				values[key] = value;
				
				if ( is_initialized )
				{
					signals['control-updated'].dispatch( values );
				}
			}
		}

		function updateInput( input, value )
		{
			if ( input && getInputValue( input ) !== value && typeof value !== 'undefined' )
			{
				setInputValue( input, value );
			}
		}

		function getCorrespondingInput( id )
		{
			var result;
			var key = getInputKey( id );
			var element_id;

			for ( var i = 0, len = controls.length; i < len; i++ )
			{
				element_id = controls[i].id;
					
				if ( element_id.indexOf( key ) !== -1 )
				{
					if ( controls[i].type === 'checkbox' )
					{
						if ( element_id === id )
						{
							result = controls[i];
							break;
						}
					}
					
					else {
						if ( element_id !== id )
						{
							result = controls[i];
							break;
						}
					}
				}
			}

			return result;
		}

		function getInputKey( id )
		{
			return id.replace( '-slider', '' ).replace( '-number', '' ).replace( '-input', '' );
		}

		function setInputValue ( input, value ) {
			input[getValueAttr( input )] = value;
		}

		function getInputValue( input )
		{
			return input[getValueAttr( input )];
		}

		function getValueAttr( input )
		{
			if ( input.type === 'checkbox' ) {
				return 'checked'
			}
			else {
				return 'value';
			}
		}

		return { init: init };
	}
);