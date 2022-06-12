import { global as eventBus } from '../lib/EventBus.js';
import { hasFileAPI } from '../util/browser.js';

export class ImportButton {
	constructor() {
		if (hasFileAPI) {
			this.fileReader = new FileReader();

			this.importInputEl = document.getElementById('import-input');
			this.importInputEl.addEventListener(
				'change',
				this.fileSelected.bind(this),
				false
			);
		}
	}

	fileSelected(event) {
		if (
			event &&
			event.target &&
			event.target.files &&
			event.target.files[0]
		) {
			eventBus.emit('load-file', event.target.files[0]);
			eventBus.emit('close-intro');
		}
	}
}
