import { global as eventBus } from '../lib/EventBus.js';
import { hasFileAPI } from '../util/browser.js';

const allowedFileTypes = [ 'image/png', 'image/jpg', 'image/jpeg' ];

export class FileLoader {
	constructor () {
		if ( hasFileAPI ) {
			this.reader = new FileReader();
			this.reader.addEventListener( 'load', this.fileLoaded.bind( this ), false );

			eventBus.on( 'load-file', this.loadFile, this );
		}
	}

	loadFile ( file ) {
		if (
			file &&
			file.type &&
			allowedFileTypes.includes( file.type )
		) {
			this.reader.readAsDataURL( file );
		}
	}

	fileLoaded ( event ) {
		eventBus.emit( 'set-new-src', event.target.result );
	}
}
