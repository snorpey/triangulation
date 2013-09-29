// most parts taken from http://jsdo.it/akm2/xoYx
// (starting line 293++)
/*global define*/
define(
	function()
	{
		function getEdgePoints( image_data, sensitivity, accuracy )
		{
			var multiplier = parseInt( ( accuracy || 0.1 ) * 10, 10 ) || 1;
			var edge_detect_value = sensitivity;
			var width  = image_data.width;
			var height = image_data.height;
			var data = image_data.data;
			var points = [ ];
			var x, y, row, col, sx, sy, step, sum, total;

			for ( y = 0; y < height; y += multiplier )
			{
				for ( x = 0; x < width; x += multiplier )
				{
					sum = total = 0;

					for ( row = -1; row <= 1; row++ )
					{
						sy = y + row;
						step = sy * width;

						if ( sy >= 0 && sy < height )
						{
							for ( col = -1; col <= 1; col++ )
							{
								sx = x + col;

								if ( sx >= 0 && sx < width )
								{
									sum += data[( sx + step ) << 2];
									total++;
								}
							}
						}
					}

					if ( total )
					{
						sum /= total;
					}

					if ( sum > edge_detect_value )
					{
						points.push( { x: x, y: y } );
					}
				}
			}

			return points;
		}

		return getEdgePoints;
	}
);