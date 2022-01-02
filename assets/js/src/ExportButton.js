import { global as eventBus } from '../lib/EventBus.js';

export class ExportButton {
	constructor () {
		this.exportBtnEl = document.getElementById( 'export-button' );
		this.pngLinkEl = document.getElementById( 'png-link' );
		this.svgLinkEl = document.getElementById( 'svg-link' );

		this.exportBtnEl.addEventListener( 'click', this.exportBtnClicked.bind( this ), false );
		this.pngLinkEl.addEventListener( 'click', this.hidePNGLink.bind( this ), false );
		this.svgLinkEl.addEventListener( 'click', this.hideSVGLink.bind( this ), false );
	}

	exportBtnClicked ( event ) {
		eventBus.emit( 'export-requested', this.updateLinkAddresses.bind( this ) );
	}

	updateLinkAddresses ( data ) {
		this.pngLinkEl.href = data.png;
		this.pngLinkEl.classList.add( 'is-active' );

		const blob = new Blob( [ data.svg ], { type: 'image/svg+xml' } );
		const svgURL = window.URL.createObjectURL( blob );

		this.svgLinkEl.href = svgURL;
		this.svgLinkEl.classList.add( 'is-active' );
	}

	hidePNGLink () {
		this.pngLinkEl.classList.remove( 'is-active' );
	}

	hideSVGLink () {
		this.svgLinkEl.classList.remove( 'is-active' );
	}
}