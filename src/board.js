$(function(){
	
	var SCORE = 0;
	var SCORE_ELEMENT = $('#score');
	
	function incrementScore(by){
		SCORE += by;
		SCORE_ELEMENT.html(SCORE);
	}

	function moveCallback(flushed_elements){
		var move_clears = flushed_elements.length;
		var move_score = 0;
		var distinct_rows = [];
		var distinct_cols = [];
		
		$.map(flushed_elements, function(element){
			var ani = $(element).data('animal');
			if (distinct_rows.indexOf(ani.x)==-1)
				distinct_rows.push(ani.x);
			if (distinct_cols.indexOf(ani.y)==-1)
				distinct_cols.push(ani.y);
		});

		if (distinct_rows.length > 1 && distinct_cols.length > 1 && move_clears > 6){
			move_score = move_clears * 4;
			$('#playground')
				.trigger('play', [ 'very_good_move' ])
				.trigger('play', [ 'very_good_move' ])
				.trigger('play', [ 'very_good_move' ])
				.trigger('play', [ 'very_good_move' ])
				.trigger('flash_message', [ 'ultra:  X 4 !' ]);
		}
		else if (distinct_rows.length > 1 && distinct_cols.length > 1){
			move_score = move_clears * 2;
			$('#playground')
				.trigger('play', [ 'very_good_move' ])
				.trigger('play', [ 'very_good_move' ])
				.trigger('flash_message', [ 'multirows:  X 2 !' ]);
		}
		else if (move_clears > 5){
			move_score = move_clears + 10;
			$('#playground')
				.trigger('play', [ 'very_good_move' ])
				.trigger('flash_message', [ '> five: 10 bonus !' ]);
		}
		else if (move_clears > 10){
			move_score = move_clears + 50;
			$('#playground')
				.trigger('play', [ 'very_good_move' ])
				.trigger('flash_message', [ '> five: 50 bonus !' ]);
		}
		else{
			move_score = move_clears;
			$('#playground')
				.trigger('play', [ 'good_move' ]);
		}
		
		incrementScore(move_score);
	}
	
	$('#playground').bind('player_move_flushed', function(event, data){
		moveCallback(data);
	});
	
});