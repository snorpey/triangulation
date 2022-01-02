import { global as eventBus } from '../lib/EventBus.js';
import { globalState as stateManager } from './State.js';
import { random } from '../util/math.js';

export class ControlsUI {
	constructor () {
		this.values = { };
		this.animationFrameId = null;

		const wrapperEl = document.querySelector( '#controls' );
		
		this.controlEls = Array.from( wrapperEl.querySelectorAll( '[data-control-id]' ) );

		stateManager.on( 'state.update', state => this.stateUpdated( state ), this );

		requestAnimationFrame( () => {
			this.setInitalState();
		} );

		this.controlEls.forEach( controlEl => {
			controlEl.addEventListener( 'change', this.controlUpdated.bind( this ), false );
			controlEl.addEventListener( 'input', this.controlUpdated.bind( this ), false );
		} );

		this.randomButtonEl = document.querySelector( '#random-button' );
		this.randomButtonEl.addEventListener( 'click', () => {
			this.randomize();
		} );
	}

	setInitalState () {
		const initialState = this.controlEls.reduce( ( values, controlEl ) => {
			const property = controlEl.getAttribute( 'data-control-id' );
			
			if ( typeof values[property] === 'undefined' ) {
				values[property] = this.getInputValue( controlEl );
			}

			return values;
		}, { } );

		stateManager.update( initialState );
	}

	stateUpdated ( state ) {
		Object
			.keys( state )
			.forEach( key => {
				this
					.getInputEls( key )
					.forEach( el => {
						if ( el[this.getValueAttr( el )] !== state[key] ) {
							el[this.getValueAttr( el )] = state[key];
						}
					} );
			} );
	}

	controlUpdated ( input ) {
		if ( Array.isArray( input ) ) {
			const inputEls = input;
			inputEls.forEach( inputEl => this.controlUpdated( inputEl ) );
		} else {
			let inputEl = input;
			
			cancelAnimationFrame( this.animationFrameId );
			
			if ( input.target ) {
				inputEl = input.target;
			}

			stateManager.update( this.getInputKey( inputEl.id ), this.getInputValue( inputEl ) );
		}
	}

	randomize () {
		stateManager.update( this.randomValues );
	}

	getInputEls ( id ) {
		return this.controlEls.filter( el => el.getAttribute( 'data-control-id' ) === id );
	}

	getInputKey ( id ) {
		return id
			.replace( '-slider', '' )
			.replace( '-number', '' )
			.replace( '-input', '' );
	}

	setControlValues ( newValues ) {
		const updatedValues = { };

		for ( let id in newValues ) {
			const controlEls = this.getInputEls( id );
			this.setInputValue( controlEls, newValues[id] );
			this.controlUpdated( controlEls );

			updatedValues[ this.getInputKey( id ) ] = newValues[id];
		}

		this.values = updatedValues;

		eventBus.emit( 'control-updated', this.values );
	}

	setInputValue ( input, value ) {
		if ( Array.isArray( input ) ) {
			const inputEls = input;
			const valuAttributeName = this.getValueAttr( inputEls );

			inputEls.forEach( inputEl => {
				if ( inputEl[valuAttributeName] !== value ) {
					inputEl[valuAttributeName] = value;
				}
			} );
		} else {
			const inputEl = input;
			inputEl[this.getValueAttr( inputEl )] = value;
		}
	}

	getInputValue ( controlEl ) {
		let value = controlEl[this.getValueAttr( controlEl )];

		if ( ['number', 'range'].includes( controlEl.getAttribute( 'type' ) ) ) {
			value = parseInt( value, 10 );
		}

		if ( ['checkbox'].includes( controlEl.getAttribute( 'type' ) ) ) {
			value = !! value;
		}

		return value;
	}

	getValueAttr ( inputEl ) {
		if ( inputEl.type === 'checkbox' ) {
			return 'checked'
		} else {
			return 'value';
		}
	}

	get constraints () {
		const result = { };

		this.numberInputEls.forEach( controlEl => {
			const id = this.getInputKey( controlEl.id );

			result[id] = {
				min: parseInt( controlEl.min, 10 ),
				max: parseInt( controlEl.max, 10 )
			};
		} );

		return result;
	}

	get numberInputEls () {
		return this.controlEls.filter( el => el.type === 'number' );
	}

	get checkboxInputEls () {
		return this.controlEls.filter( inputEl => inputEl.type === 'checkbox' );
	}

	get randomValues () {
		const newValues = { };

		for ( let id in this.constraints ) {
			const constraint = this.constraints[id];
			newValues[id] = random( constraint.min, constraint.max, true );			
		}
		
		this
			.checkboxInputEls
			.forEach( inputEl => {
				newValues[this.getInputKey( inputEl.id )] = Math.random() > 0.5;
			} );

		return newValues;
	}
}
