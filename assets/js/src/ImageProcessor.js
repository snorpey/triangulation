import triangulate from '../lib/triangulate-image-browser.es6.js';
import { global as eventBus } from '../lib/EventBus.js';
import { globalState as stateManager } from './State.js';
import { DPR } from '../util/browser.js';
import { mapRange } from '../util/math.js';
import { clearCanvas, updateCanvas, resizeCanvas } from '../util/canvas.js';

export class ImageProcessor {
	constructor() {
		this.canvasWrapperEl = document.querySelector(
			'.sn-workspace__canvas-wrapper'
		);
		this.canvasEl = document.getElementById('canvas');
		this.ctx = this.canvasEl.getContext('2d');

		this.isProcessing = false;
		this.resizeAnimationFrameId = null;
		this.image = null;

		eventBus.on('image-loaded', this.generate, this);
		eventBus.on('export-requested', this.exportData, this);
		stateManager.on('state.update', state => this.update(state), this);

		window.addEventListener('resize', () => {
			this.resized();
		});
	}

	get triangulationParams() {
		return sanitizeParameters(stateManager.state);
	}

	update() {
		if (!this.isProcessing && this.image) {
			this.processImage(this.image);
		}
	}

	resized() {
		cancelAnimationFrame(this.resizeAnimationFrameId);

		this.resizeAnimationFrameId = requestAnimationFrame(() => {
			this.update();
		});
	}

	generate(img) {
		if (!this.isProcessing) {
			this.image = img;
			this.update();
		}
	}

	processImage(img) {
		this.isProcessing = true;

		triangulate(this.triangulationParams)
			.fromImage(img)
			.toImageData({ dpr: DPR })
			.then(triangulatedImageData => {
				clearCanvas(this.canvasEl, this.ctx);
				resizeCanvas(this.canvasEl, img, DPR, this.canvasWrapperEl);
				updateCanvas(this.ctx, triangulatedImageData);

				this.isProcessing = false;
			});
	}

	exportData(callbackFn) {
		if (typeof callbackFn === 'function') {
			const data = {
				png: this.canvasEl.toDataURL('image/png'),
				svg: triangulate(this.triangulationParams)
					.fromImageSync(this.image)
					.toSVGSync(),
			};

			callbackFn(data);
		}
	}
}

function sanitizeParameters(values) {
	const result = {};

	for (let key in values) {
		switch (key) {
			case 'blur':
				result[key] = Math.round(
					mapRange(parseInt(values[key], 10), 0, 100, 1, 100)
				);
				break;

			case 'accuracy':
				result[key] = mapRange(
					parseInt(values[key], 10),
					0,
					100,
					1,
					0.1
				);
				break;

			case 'vertex-count':
				result.vertexCount = Math.round(
					mapRange(parseInt(values[key], 10), 0, 100, 100, 5000)
				);
				break;
		}

		result.fill = !!values.fill;
		result.gradients = !!values.gradients;
		result.gradientStops = 2;
		result.strokeWidth = mapRange(
			parseInt(values['stroke-width'], 10),
			0,
			100,
			0,
			100
		);
	}

	return result;
}
