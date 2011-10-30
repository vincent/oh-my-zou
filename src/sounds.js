
soundManager.url = 'res/swf';
soundManager.flashVersion = 9;
soundManager.useFlashBlock = false;
soundManager.debug = location.href.indexOf('debug=1') > 0;
	
setTimeout(function(){
	$('#sm2-container').attr('style', 'z-index: 10000; position: absolute; width: 6px; height: 6px;');
}, 3000);

$(function(){
	
	SOUNDS = {};
	MUTE = $.cookie('muted')==1 && $('#mute').addClass('muted') ? 1 : 0;
	
	function play(sound, data){
		if (sound in SOUNDS){
			if (sound == 'music') data.loop = true;
			SOUNDS[sound].play(data);
		}
		else{
			console.log('unknown sound %o', sound);
		}
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
	
	function loadSounds(soundpack){
		soundManager.onready(function() {
			$.each(soundpack, function(sound){
				if (sound in SOUNDS) return;
				
				SOUNDS[sound] = new $.gameQuery.SoundWrapper(soundpack[sound], false);
				SOUNDS[sound].load();
				console.log("loading sound %o : %o %o %o ", sound, soundpack[sound], SOUNDS[sound].id, SOUNDS[sound]);
			});
		});
	}

	// register sound events
	$('#playground').bind('play', function(event, sound, data){
		play(sound, data);
	});
	$('#playground').bind('load_soundpack', function(event, data){
		loadSounds(data);
	});

	// mute button
	$('#mute').click(mute);
	
	soundManager.onready(function() {
        
	});
	
});
