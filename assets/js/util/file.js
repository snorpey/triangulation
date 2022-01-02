export function dataURLToFile ( dataURL, fileName ) {
	return fetch( dataURL )
		.then( res => res.blob() )
		.then( blob => new File( [ blob ], fileName, { type: 'image/png' } ) );
}