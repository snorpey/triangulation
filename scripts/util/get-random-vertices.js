// most parts taken from akm2's script:
// http://jsdo.it/akm2/xoYx (line 230++)
/*global define*/
define(
	function()
	{
		function getRandomVertices( points, rate, max_num, accuracy, width, height )
		{
			var j;
			var result = [ ];
			var i = 0;
			var i_len = points.length;
			var t_len = i_len;
			var limit = Math.round( i_len * rate );

			points = points.slice();

			if ( limit > max_num )
			{
				limit = max_num;
			}

			while ( i < limit && i < i_len )
			{
				j = t_len * Math.random() | 0;
				result.push( { x: points[j].x, y: points[j].y } );

				// this seems to be extremely time
				// intensive.
				// points.splice( j, 1 );

				t_len--;
				i++;
			}

			var x, y;

			// gf: add more points along the edges so we always use the full canvas,
			for ( x = 0; x < width; x += (100 - accuracy) )
			{
				result.push( { x: ~~x, y: 0 } );
				result.push( { x: ~~x, y: height } );
			}

			for ( y = 0; y < height; y += (100 - accuracy) )
			{
				result.push( { x: 0, y: ~~y } );
				result.push( { x: width, y: ~~y } );
			}

			result.push( { x: 0, y: height } );
			result.push( { x: width, y: height } );

			return result;
		}

		return getRandomVertices;
	}
);
