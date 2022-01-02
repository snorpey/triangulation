export const DPR = ( window.devicePixelRatio && window.devicePixelRatio > 1 )
	? window.devicePixelRatio
	: 1;

export const hasFileAPI = typeof FileReader !== 'undefined';
export const hasDragDropAPI = 'draggable' in document.createElement( 'span' );
export const hasShareAPI = !! navigator.share;
export const hasShareCheckAPI = !! navigator.canShare;

export function checkVideoInput () {
	const canEnumerateDevices = !! navigator.mediaDevices && !! navigator.mediaDevices.enumerateDevices;
	
	if ( ! canEnumerateDevices ) {
		return Promise.resolve( false );
	}

	if ( canEnumerateDevices ) {
		return navigator
			.mediaDevices
			.enumerateDevices()
			.then( devices => {
				let result = false;

				devices.forEach( device => {
					if (
						device &&
						device.kind &&
						device.kind === 'videoinput'
					) {
						result = true;
					}
				} );

				return result;
			} );
	} else if ( navigator.getUserMedia ) {
		return Promise.resolve( true );
	}
}

// https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
export function requestVideoStream ( mediaConstraints = null, orientation = 'auto' ) {
	if ( ! mediaConstraints ) {
		mediaConstraints = {
			video: true,
			audio: false
		};
	};

	return navigator.mediaDevices
		? navigator.mediaDevices.getUserMedia( mediaConstraints )
			.then( stream => {
				const tracks = stream.getVideoTracks();

				tracks.forEach( track => {				
					if ( track.getCapabilities ) {
						const capabilities = track.getCapabilities();

						if ( capabilities.facingMode && capabilities.facingMode.length > 0 ) {
							currentCameraDirection = capabilities.facingMode[0];
						}
					}
				} );

				return stream;
			} )
		: Promise.reject( new Error( 'Can\'t access camera.' ) );

}

export function isDocumentReady () {
	return document.readyState === 'complete';
}

export function waitForDocumentReady () {
	if ( isDocumentReady() ) {
		return Promise.resolve();
	}

	return new Promise( resolve => {
		let intervalId = setInterval( () => {
			clearInterval( intervalId );

			if ( isDocumentReady() ) {
				resolve();
			}
		}, 50 );
	} );
}
