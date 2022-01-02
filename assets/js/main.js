import { waitForDocumentReady } from './util/browser.js';
import { global as eventBus } from './lib/EventBus.js';
import { ImageProcessor } from './src/ImageProcessor.js';
import { ImageLoader } from './src/ImageLoader.js';
import { FileLoader } from './src/FileLoader.js';
import { DragDropUI } from './src/DragDropUI.js';
import { ControlsUI } from './src/ControlsUI.js';
import { ExportButton } from './src/ExportButton.js';
import { ImportButton } from './src/ImportButton.js';
import { ShareUI } from './src/ShareUI.js';
import { CamUI } from './src/CamUI.js';

function init () {
	const imageProcessor = new ImageProcessor();
	const imageLoader = new ImageLoader();
	const fileLoader = new FileLoader();
	const dragDropUI = new DragDropUI();
	const controlsUI = new ControlsUI();
	const exportButton = new ExportButton();
	const importButton = new ImportButton();
	const camUI = new CamUI();
	const shareUI = new ShareUI();

	// the image "Abraham Lincoln November 1863" is public domain:
	// https://en.wikipedia.org/wiki/File:Abraham_Lincoln_November_1863.jpg
	const defaultimage = document.body.getAttribute( 'data-defaultimage' );

	eventBus.emit( 'set-new-src', defaultimage );

	Array.from( document.querySelectorAll( '.sn-btn[for]' ) )
		.forEach( collapseBtnEl => {
			const collapsibleId = collapseBtnEl.getAttribute( 'for' );
			
			collapseBtnEl.addEventListener( 'click', () => {
				setTimeout( () => {
					const inputEls = Array.from( document.querySelectorAll( '.sn-btn__toggle-input' ) )
						.forEach( inputEl => {
							const inputId = inputEl.getAttribute( 'id' );

							if (
								inputId !== collapsibleId &&
								! [ inputId, collapsibleId ].includes( 'is-showing-controls' )
							) {
								inputEl.checked = false;								
							}
						} );
				}, 40 );
			} );
		} );
}

waitForDocumentReady()
	.then( init );
