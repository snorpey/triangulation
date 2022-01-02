export function mapRange ( value, inMin, inMax, outMin, outMax, clampResult ) {
	let result = ( ( value - inMin ) / ( inMax - inMin ) * ( outMax - outMin ) + outMin );

	if ( clampResult ) {
		if ( outMin > outMax ) {
			result = Math.min( Math.max( result, outMax ), outMin );
		} else {
			result = Math.min( Math.max( result, outMin ), outMax );
		}
	}

	return result;
}

export function random ( min, max, round = false ) {
	const result = min + ( Math.random() * ( max - min ) );
	
	return round
		? Math.round( result )
		: result;
}