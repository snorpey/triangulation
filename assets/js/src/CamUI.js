import { checkVideoInput, requestVideoStream } from '../util/browser.js';
import { global as eventBus } from '../lib/EventBus.js';

export class CamUI {
	constructor () {
		this.camButtonEl = document.getElementById( 'cam-button' );

		checkVideoInput()
			.then( hasVideoInput => {
				if ( hasVideoInput ) {
					this.camButtonEl.removeAttribute( 'visibility' );
					this.camButtonEl.addEventListener( 'click', () => this.toggleCameraDisplay() );

					this.overlayEl = document.querySelector( '.sn-overlay--cam' );
					this.shutterBtnEl = document.querySelector( '#cam_shutter' );
					this.closeBtnEl = document.querySelector( '#cam_close' );
					this.videoEl = document.querySelector( '#cam_video' );

					this.shutterBtnEl.addEventListener( 'click', () => this.takePicture() );
					this.closeBtnEl.addEventListener( 'click', () => this.closeCamera() );

					this.stream = null;					
				}
			} );
	}

	toggleCameraDisplay () {
		if ( this.stream ) {
			this.closeCamera();
		} else {
			this.openCamera();
		}
	}

	openCamera () {
		document.documentElement.classList.add( 'sn-overlay__container--open' );
		this.overlayEl.removeAttribute( 'aria-hidden' );

		requestVideoStream()
			.then( stream => {
				this.stream = stream;
				this.videoEl.srcObject = stream;
			} );
	}

	closeCamera () {
		if ( this.stream ) {
			this.videoEl.srcObject = null;
			this.stream.getTracks().forEach( track => track.stop() );
			this.stream = null;
		}

		document.documentElement.classList.remove( 'sn-overlay__container--open' );
		this.overlayEl.setAttribute( 'aria-hidden', 'true' );
	}

	takePicture () {
		if ( this.stream ) {
			const canvasEl = document.createElement( 'canvas' );
			canvasEl.width = this.videoEl.clientWidth;
			canvasEl.height = this.videoEl.clientHeight;

			const ctx = canvasEl.getContext( '2d' );
			ctx.drawImage( this.videoEl, 0, 0 );

			const imageSrc = canvasEl.toDataURL( 'image/png' );
			eventBus.emit( 'set-new-src', imageSrc );

			this.closeCamera();
		}
	}
}
