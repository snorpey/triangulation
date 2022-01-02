import { global as eventBus } from '../lib/EventBus.js';
import { hasDragDropAPI } from '../util/browser.js';

export class DragDropUI {
	constructor () {
		if ( hasDragDropAPI ) {
			document.addEventListener( 'drop', this.dropped.bind( this ), false );
			document.addEventListener( 'dragover', event => event.preventDefault(), false );
			document.addEventListener( 'dragleave', event => event.preventDefault(), false );
		}
	}

	dropped ( event ) {
		event.preventDefault();

		if (
			event.dataTransfer &&
			event.dataTransfer.files &&
			event.dataTransfer.files[0]
		) {
			eventBus.emit( 'load-file', event.dataTransfer.files[0] );
			eventBus.emit( 'close-intro' );
		}
	}
}
