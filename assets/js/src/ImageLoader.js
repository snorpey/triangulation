import { global as eventBus } from '../lib/EventBus.js';

export class ImageLoader {
	constructor () {
		this.wasInitialized = false;
		
		this.image = new Image();
		this.image.addEventListener( 'load', this.imageLoaded.bind( this ) );
		
		eventBus.on( 'set-new-src', this.setSrc, this );
	}

	imageLoaded () {
		eventBus.emit( 'image-loaded', this.image );

		if ( this.wasInitialized ) {
			eventBus.emit( 'close-intro' );
		}

		this.wasInitialized = true;
	}

	setSrc ( src ) {
		this.image.src = src;

		if (
			this.wasInitialized &&
			this.image.naturalWidth !== undefined &&
			this.image.naturalWidth !== 0
		) {
			setTimeout( () => {
				this.imageLoaded();
			}, 100 );
		}
	}
}
