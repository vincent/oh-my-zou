
soundManager.url = 'res/swf';
soundManager.flashVersion = 9;
soundManager.useFlashBlock = false;
	
$(function(){
	
	SOUNDS = null;
	MUTE = $.cookie('muted')==1 && $('#mute').addClass('muted') ? 1 : 0;
	
	function play(sound, data){
		SOUNDS[sound].play(data);
	};
	
	function playMusic(){
		// looping is not implemented ?
		SOUNDS['music'].play();
	};
	
	function mute(toggle){
		if (toggle === false)
			MUTE = false;
		else if (toggle === true)
			MUTE = true;
		else
			MUTE = !MUTE;

		if (MUTE) {
			$.cookie('muted', 1);
			soundManager.mute();
			$('#mute').addClass('muted');
		}
		else {
			$.cookie('muted', 0);
			soundManager.unmute();
			$('#mute').removeClass('muted');
		};
	}

	// register sound events
	$('#playground').bind('play', function(event, sound, data){
		play(sound, data);
	});

	// mute button
	$('#mute').click(mute);
	
	soundManager.onready(function() {
	
		SOUNDS = {
			music : new $.gameQuery.SoundWrapper('res/sounds/beat.mp3', true),
			bad_move : new $.gameQuery.SoundWrapper('res/sounds/music.mp3', false),
			good_move : new $.gameQuery.SoundWrapper('res/sounds/splash.mp3', false),
			very_good_move : new $.gameQuery.SoundWrapper('res/sounds/splash.mp3', false)
		};
		
		for (sound in SOUNDS) {
			SOUNDS[sound].load();
			console.log("loading sound %o : %o", SOUNDS[sound].id, sound);
		}

		playMusic();
	});

	
});
