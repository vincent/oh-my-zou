$(function(){

	function nextLevel(){
		$('#playground').trigger('start_game', LEVELS[CURRENT_LEVEL++]);
	}

	var CURRENT_LEVEL = 0;
	var LEVELS = [
		{   /*   LEVEL 1   */
			title: 'level 1',
			background: 'url(res/img/bg_pixel.gif) top center',

			goal_score: 200,
			onComplete: nextLevel,

			animals: [
	          { img: 'res/img/blowfish.png', animal_class: 'blowfish' },
	          { img: 'res/img/ladybug.png', animal_class: 'ladybug' },
	          { img: 'res/img/whale.png', animal_class: 'whale' },
	          { img: 'res/img/cat.png', animal_class: 'cat' },
	          { img: 'res/img/owl.png', animal_class: 'owl' }
	        ],
	        sounds: {
	        	music : 'res/sounds/beat.mp3',
				bad_move : 'res/sounds/music.mp3',
				good_move : 'res/sounds/splash.mp3',
				very_good_move : 'res/sounds/splash.mp3'
	        }
		}
	];

	/* MAIN START */
	nextLevel();
});