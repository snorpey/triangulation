export function updateCanvas ( ctx, image_data ) {
	ctx.putImageData( image_data, 0, 0 );
}

export function resizeCanvas ( canvasEl, img, dpr, containerEl = window ) {
	canvasEl.width = img.width * dpr;
	canvasEl.height = img.height * dpr;

	const containerWidth = containerEl.clientWidth;
	const containerHeight = containerEl.clientHeight;

	const maxWidth = containerWidth - 32;
	const maxHeight = containerHeight - 32;

	const widthRatio = containerWidth / canvasEl.width;
	const heighthRatio = containerHeight / canvasEl.height;

	const ratio = Math.min( widthRatio, heighthRatio );

	canvasEl.style.maxWidth = `${canvasEl.width * ratio}px`;
	canvasEl.style.maxHeight = `${canvasEl.height * ratio}px`;
}

export function clearCanvas ( canvasEl, ctx ) {
	ctx.clearRect( ctx, 0, 0, canvasEl.width, canvasEl.height );
}