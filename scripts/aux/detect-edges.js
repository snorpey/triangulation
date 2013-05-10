// most parts taken from http://jsdo.it/akm2/xoYx
// (starting line 366++)
/*global define*/
define(
	function()
	{
		/**
		 * @see http://jsdo.it/akm2/iMsL
		 */
		function detectEdges( image_data, accuracy, edge_size, divisor )
		{
			var matrix = getEdgeMatrix( edge_size ).slice();
			var multiplier = parseInt( ( accuracy || 0.5 ) * 10, 10 ) || 1;

			divisor = divisor || 1;

			var divscalar = divisor ? 1 / divisor : 0;
			var k, len;

			if ( divscalar !== 1 )
			{
				for ( k = 0, len = matrix.length; k < matrix.length; k++ )
				{
					matrix[k] *= divscalar;
				}
			}

			var data = image_data.data;

			len = data.length >> 2;

			var copy = new Uint8Array( len );

			for (i = 0; i < len; i++)
			{
				copy[i] = data[i << 2];
			}

			var width  = image_data.width | 0;
			var height = image_data.height | 0;
			var size  = Math.sqrt( matrix.length );
			var range = size * 0.5 | 0;

			var x, y;
			var r, g, b, v;
			var col, row, sx, sy;
			var i, istep, jstep, kstep;

			for ( y = 0; y < height; y += multiplier )
			{
				istep = y * width;

				for ( x = 0; x < width; x += multiplier  )
				{
					r = g = b = 0;

					for ( row = -range; row <= range; row++ )
					{
						sy = y + row;
						jstep = sy * width;
						kstep = (row + range) * size;

						if ( sy >= 0 && sy < height )
						{
							for ( col = -range; col <= range; col++ )
							{
								sx = x + col;

								if (
									sx >= 0 && sx < width &&
									( v = matrix[( col + range ) + kstep] )
								)
								{
									r += copy[sx + jstep] * v;
								}
							}
						}
					}

					if ( r < 0 )
					{
						r = 0;
					}

					else
					{
						if ( r > 255 )
						{
							r = 255;
						}
					}

					data[( x + istep ) << 2] = r & 0xFF;
				}
			}

			return image_data;
		}

		function getEdgeMatrix( size )
		{
			var matrix = [ ];
			var side = size * 2 + 1;
			var i, len = side * side;
			var center = len * 0.5 | 0;

			for ( i = 0; i < len; i++ )
			{
				matrix[i] = i === center ? -len + 1 : 1;
			}

			return matrix;
		}

		return detectEdges;
	}
);