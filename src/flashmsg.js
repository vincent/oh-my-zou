$(function(){
	
	function flashMessage(text) {
		var id = parseInt(Math.random()*10000);
		$('#playground').append('<span id="flash_message_'+id+'" class="flash_message">'+text+'</span>');
		$('#flash_message_'+id).animate({ zoom: 2 }, function(){
			$(this).remove();
		});
	}

	$('#playground').bind('flash_message', function(event, data){
		flashMessage(data);
	});

});