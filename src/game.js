
function get_url_param(name){
	var regexS = "[\\?&]"+name+"=([^&#]*)";
	var results = new RegExp( regexS ).exec( location.href );
	if( results == null )
		return "";
	else
		return results[1];
};

$(function(){

	function startGame(GAME_DATA){

		var PLAYGROUND_SIDE = get_url_param('size') || 10;
		$('#boardsize')
			.val(PLAYGROUND_SIDE)
			.change(function(){
				location.href = location.origin += '?size='+$(this).val();
			});
	
		var TILE_SIZE = 30;
		var PLAYGROUND_PIXEL_SIZE = PLAYGROUND_SIDE * TILE_SIZE;
	
		var PLAYGROUND_POSITION = { x:0, y:0 };
	
		var PLAYGROUND_ANIMALS = new Array();
		for (var x=0; x<PLAYGROUND_SIDE; PLAYGROUND_ANIMALS[x++] = new Array());
		
		var PLAYERMOVES = 0;
		
		var CURRENT_ANIMAL = false;
		
		var FLUSH_IDS_QUEUE = new Array();
		var FLUSH_QUEUE = new Array();
		for (var y=0; y<PLAYGROUND_SIDE; FLUSH_QUEUE.push(0)) y++;
	
		var Q = $('body');
		var qname = 'QUEUE_ITEM';
		
		/*** GAME DATA ***************************************************/
		var ANIMALS = GAME_DATA.animals;
		
		/* Reset some elements */
		$('#playground').trigger('reset_score');

		if (GAME_DATA.title)
			$('#level_title').html(GAME_DATA.title);

		if (GAME_DATA.background)
			$('#board').css('background', GAME_DATA.background );

		// load game sounds
		$('#playground').trigger('load_soundpack', GAME_DATA.sounds);
	
		/*****************************************************************/
		
		// this is a method that returns a random element from the given array
		function random(choice){
			return choice[Math.round(Math.random()*(choice.length-1))];
		};
	
	    // function to apply easing to passed element
	    function AnimateElement(element, newpos){
	        $(element).stop().animate({
	            top: newpos.top,
	            left: newpos.left
	        }, 50, 'easeOutCirc');
	    }
	    
	    function inverseDirection(direction){
	    	return {
	        	'N': 'S',
	        	'S': 'N',
	        	'E': 'W',
	        	'W': 'E'
	        }[direction];
	    }
		
	    function resetFlushQueue(){
	    	FLUSH_QUEUE = new Array();
	    	FLUSH_IDS_QUEUE = new Array();
	    	for (var x=0; x<PLAYGROUND_SIDE; FLUSH_QUEUE.push(0)) x++;
	    	
	    	$('.flushed').removeClass('flushed');
	    };
	    
	    // on player move
	    function onPlayerMove(event, ui){
	    	PLAYERMOVES++;
	    	console.groupCollapsed("player's %oth move", PLAYERMOVES);
	
	    	// get aimed element
	        var direction = ui.helper.data('draggableXY.direction');
	        var target_element = jQuery(event.target);
	        var target_animal = target_element.data('animal');
	        var aimed_element = {
	        	'N': target_animal.up(1),
	        	'S': target_animal.down(1),
	        	'E': target_animal.right(1),
	        	'W': target_animal.left(1)
	        }[direction];
	        var aimed_animal = aimed_element ? aimed_element.data('animal') : false;
	        
	        if (!target_element || !aimed_element || !target_animal || !aimed_animal){
	        	console.error('Ooops, someone is missing among target_element(%o) , aimed_element(%o), target_animal(%o) or aimed_animal(%o)',
	        			target_element.lenght<1, aimed_element.lenght<1, target_animal==null, aimed_animal==null);
	        	// revert the action
	        	console.groupEnd();
	        	return true;
	        }
	        
	        // see if it fits
	        var in_row = aimed_element && aimed_element.data('animal').isInRow(
	        		target_animal.animal_def.animal_class, inverseDirection(direction));
	        if (aimed_element && in_row) {
				console.info('Yeah, go switch %o and %o, a row of %o will occur on %o, direction was %o', 
						target_element.attr('id'), aimed_element.attr('id'), target_animal.animal_def.animal_class, 
						in_row, inverseDirection(direction));
	
				// switch !
				var switched = switchAnimals(target_element, target_animal, aimed_element, aimed_animal);
				target_element= switched[0];
				target_animal = switched[1];
				aimed_element = switched[2];
				aimed_animal  = switched[3];
				
		        AnimateElement(aimed_element, {
		        	left:(aimed_animal.x*TILE_SIZE)+PLAYGROUND_POSITION.x,
		        	top:(aimed_animal.y*TILE_SIZE)+PLAYGROUND_POSITION.y
				});
	
		        AnimateElement(target_element, {
					left:(target_animal.x*TILE_SIZE)+PLAYGROUND_POSITION.x,
					top:(target_animal.y*TILE_SIZE)+PLAYGROUND_POSITION.y
				});
				
		        ui.helper.data('draggableXY.originalPosition', {
					left:(aimed_animal.x*TILE_SIZE)+PLAYGROUND_POSITION.x,
					top:(aimed_animal.y*TILE_SIZE)+PLAYGROUND_POSITION.y
				});    	
	
				$revert = false;
				
				lookForFlush(target_animal.x, target_animal.y);
	        }
	        else {
				console.warn('No! WTF are you trying to do ?');
	
				aimed_element.css({
					top: (target_animal.y*TILE_SIZE)+PLAYGROUND_POSITION.y,
					left: (target_animal.x*TILE_SIZE)+PLAYGROUND_POSITION.x
				});
	            AnimateElement(aimed_element, {
	            	left: (aimed_animal.x*TILE_SIZE)+PLAYGROUND_POSITION.x,
	            	top: (aimed_animal.y*TILE_SIZE)+PLAYGROUND_POSITION.y
				});
	
	            $revert = true;
	        }
	
	    	console.groupEnd();
	        return $revert;
	    };
	    
	    
	    function switchAnimals(target_element, target_animal, aimed_element, aimed_animal){
	    	
			var target_orig_x = target_animal.x;
			var target_orig_y = target_animal.y;
	
			var aim_orig_x = aimed_animal.x;
			var aim_orig_y = aimed_animal.y;
			
			var tmp_t = PLAYGROUND_ANIMALS[target_animal.x][target_animal.y];
			var tmp_a = PLAYGROUND_ANIMALS[aimed_animal.x][aimed_animal.y];
	
			// switch target, but position
			PLAYGROUND_ANIMALS[target_orig_x][target_orig_y] = tmp_a;
			PLAYGROUND_ANIMALS[target_orig_x][target_orig_y].x = target_orig_x;
			PLAYGROUND_ANIMALS[target_orig_x][target_orig_y].y = target_orig_y;
			
			// switch aim, but position
			PLAYGROUND_ANIMALS[aim_orig_x][aim_orig_y] = tmp_t;
			PLAYGROUND_ANIMALS[aim_orig_x][aim_orig_y].x = aim_orig_x;
			PLAYGROUND_ANIMALS[aim_orig_x][aim_orig_y].y = aim_orig_y;
	
			target_animal = PLAYGROUND_ANIMALS[aim_orig_x][aim_orig_y];
			target_element.data('animal', target_animal);
			
			aimed_animal = PLAYGROUND_ANIMALS[target_orig_x][target_orig_y];
			aimed_element.data('animal', aimed_animal);
			
	        console.info('%o should go to (%o,%o)', aimed_element.attr('id'), aimed_animal.x, aimed_animal.y);
	
	        console.info('%o is now ..', aimed_element.attr('id'));
	        aimed_animal.id = 'animal-'+aimed_animal.x+'-'+aimed_animal.y;
	        aimed_element.attr('id', aimed_animal.id);
	        console.info('.. %o', aimed_element.attr('id'));
	
	        console.info('%o should go to (%o,%o)', target_element.attr('id'), target_animal.x, target_animal.y);
	
	        console.info('%o is now ..', target_element.attr('id'));
	        target_animal.id = 'animal-'+target_animal.x+'-'+target_animal.y;
	        target_element.attr('id', target_animal.id);
	        console.info('.. %o', target_element.attr('id'));
	        
	        return [ target_element, target_animal, aimed_element, aimed_animal ];
	    }
	    
	    function createAnimal(x, y, name, animal, tag){
	    	if (!tag) tag = new Date().toUTCString();
	    	
	    	$.playground().addSprite(name, {
				posx: (x*TILE_SIZE)+PLAYGROUND_POSITION.x,
				posy: (y*TILE_SIZE)+PLAYGROUND_POSITION.y,
				height: TILE_SIZE,
				width: TILE_SIZE,
				animation: new $.gameQuery.Animation({ imageURL: animal.img, type: $.gameQuery.ANIMATION_VERTICAL, numberOfFrame: 3, delta: 30 })
			});
	    	
	    	PLAYGROUND_ANIMALS[x][y] = {
				x: x,
				y: y,
				tag: tag,
				id: name,
				animal_def: animal,
				
				rename: function(new_name){
					$('#'+this.id).attr('id', new_name);
					this.id = new_name;
				},
				
				reposition: function(x, y){
					PLAYGROUND_ANIMALS[x][y] = false;
					this.x = x;
					this.y = y;
					var new_id = 'animal-'+x+'-'+y;
					this.rename(new_id);
					PLAYGROUND_ANIMALS[x][y] = this;
				},
				
				hasClass: function(classname){
					return this.animal_def.animal_class == classname;
				},
				
				up: function(by) {
					var obj = PLAYGROUND_ANIMALS[this.x][this.y-by];
					return typeof(obj)!='undefined' ? jQuery('#'+obj.id) : false;
				},
				down: function(by) {
					var obj = PLAYGROUND_ANIMALS[this.x][this.y+by];
					return typeof(obj)!='undefined' ? jQuery('#'+obj.id) : false;
				},
				left: function(by) {
					var obj = typeof(PLAYGROUND_ANIMALS[this.x-by])!='undefined' ? PLAYGROUND_ANIMALS[this.x-by][this.y] : false;
					return obj ? jQuery('#'+obj.id) : false;
				},
				right: function(by){
					var obj = typeof(PLAYGROUND_ANIMALS[this.x+by])!='undefined' ? PLAYGROUND_ANIMALS[this.x+by][this.y] : false;
					return obj ? jQuery('#'+obj.id) : false;
				},
				
				isInRow: function(animal_class, except_direction) {
	
					var allowed_north = except_direction != 'N';
					var allowed_south = except_direction != 'S';
					var allowed_est = except_direction != 'E';
					var allowed_west = except_direction != 'W';
					
					// north and ( north2 or south )
					var up = this.up(1);
					var up2 = this.up(2);
					var down = this.down(1);
					if (allowed_north && up && up.hasClass(animal_class))
						if (allowed_south && down && down.hasClass(animal_class))
							return 'north and south';
						else if (up2 && up2.hasClass(animal_class))
							return 'north and north2';
	
					// south and ( south2 or north )
					var down2 = this.down(2);
					if (allowed_south && down && down.hasClass(animal_class))
						if (allowed_north && up && up.hasClass(animal_class))
							return 'south and north';
						else if (down2 && down2.hasClass(animal_class))
							return 'south and south2';
	
					delete up, up2, down, down2;
					
					// est and ( est2 or west )
					var right = this.right(1);
					var right2 = this.right(2);
					var left = this.left(1);
					if (allowed_est && right && right.hasClass(animal_class))
						if (allowed_west && left && left.hasClass(animal_class))
							return 'est and west';
						else if (right2 && right2.hasClass(animal_class))
							return 'est and est2';
	
					// west and ( west2 or est )
					var left2 = this.left(2);
					if (allowed_west && left && left.hasClass(animal_class))
						if (left2 && left2.hasClass(animal_class))
							return 'west and west2';
						else if (allowed_est && right && right.hasClass(animal_class))
							return 'west and est';
	
					return false;
				}
			};
	    	
	    	$('#'+name)
	    		.css('opacity', 0)
	    		.animate({opacity: 1}, 800)
				.addClass(animal.animal_class)
				.data('animal', PLAYGROUND_ANIMALS[x][y])
				.mousedown(function(){
					$('body').addClass('dragging');
				})
				.mouseup(function(){
					$('body').removeClass('dragging');
				})
				.draggableXYE({
				    revert: true,
				    dynamic: false,
				    reloads: true,
				    stop: onPlayerMove
				});	
	    	
	    	console.info("Add a %o named %o on %o:%o", animal.animal_class, name, x, y);
	    	
	    	return PLAYGROUND_ANIMALS[x][y];    	
	    }
	    
		// here come some animals !
		function fillPlayground(){
			console.groupCollapsed('Adding some wild animals');
			for (var y=0; y<PLAYGROUND_SIDE; y++) {
	    		for (var x=0; x<PLAYGROUND_SIDE; x++) {
	    			if (typeof(PLAYGROUND_ANIMALS[x][y]) == 'undefined') {
	    		    	createAnimal(x, y, 'animal-'+x+'-'+y, random(ANIMALS), 'GAME_START');
					}
				}
			}
			console.groupEnd();
		};
		
		var effect;
		function flushCommit_clear_animals(){
			var flushed = $('.flushed');
			if (flushed.length <= 0) return;
			
			$('body').addClass('goodmoved');
			setTimeout(function(){
				$('body').removeClass('goodmoved');
			}, 800);
			
			$('#playground').trigger('player_move_flushed', [ flushed ]);
	
			$.map(flushed, function(element_to_flush){
				element_to_flush = $(element_to_flush);
				if (element_to_flush.attr('id').match(/animal-\d-\d-/)) return;
				
				var animal = element_to_flush.data('animal');
				var new_id = element_to_flush.attr('id')+'-clearing';
				animal.rename(new_id);
	
				// Animate, and dismiss element
				Q.queue(qname, function(next){
					console.info('Animate %o for clearing', element_to_flush.attr('id'));
					// jQuery (positionnal) animation
					element_to_flush.animate({ top: PLAYGROUND_PIXEL_SIZE+PLAYGROUND_POSITION.y+TILE_SIZE, opacity: .4 }, 800, function(){
						//debugger;
						element_to_flush.remove();
						
						if (!animal){
							//debugger;
						}
						else{
							createAnimal(animal.x, animal.y, 'animal-'+animal.x+'-'+animal.y, random(ANIMALS), 'MOVE_'+PLAYERMOVES);
						}
						
						next();
					});
					// gameQuery (graphic) animation
					// gameQuery (graphic) animation
					//debugger;

					/* */
					element_to_flush.addSprite("effect-"+animal.id, {
						animation: effect,
						posx: animal.x,
						posy: animal.y,
						height: 30,
						width: 30
					});
					//console.log('%o.setAnimation %o', element_to_flush, effect);
					/* */

				});
			});
		}
	
		function flushCommit(callback){
			flushCommit_clear_animals();
			
			Q.queue(qname, resetFlushQueue);
			Q.queue(qname, callback);
			
			Q.dequeue(qname);
			Q.dequeue(qname);
			return;
		};
		
		function lookForFlush(start_x, start_y){
			//debugger;
			if (!start_x) start_x = 0;
			if (!start_y) start_y = 0;
			console.info("looking for elements to flush");
			for (var x=start_x; x<PLAYGROUND_SIDE; x++){
				for (var y=start_y; y<PLAYGROUND_SIDE; y++){
					var element = $('#'+PLAYGROUND_ANIMALS[x][y].id);
					var animal = element.data('animal');
					
					if (!element.hasClass('flushed') && animal.isInRow(animal.animal_def.animal_class))
						collectFreeElements(animal, animal.animal_def.animal_class, 'ALL');
				}
			}
	
			if (flushQueueSize() > 0){
				flushCommit(function(){ lookForFlush(); });
			}
			else {
				console.info("Seems clean, bye");
			}
		};
		
		function flushQueueSize(){
			return $('.flushed').length;
			
			var lengths = $.map(FLUSH_QUEUE, function(e){ return e; });
			var sum = 0;
			for (var i=0,sum=0; i<FLUSH_QUEUE.length; sum+=parseInt(FLUSH_QUEUE[i++]));
			console.info('%o objects in flushing queue', sum);
			return sum;
		};
		
		function collectFreeElements(element, animal_class, mode){
			
			if (!element || !element.hasClass(animal_class) || element.hasClass('flushed') || FLUSH_IDS_QUEUE.indexOf(element.id)>=0) return;
			element.marked_for_flush = true;
			FLUSH_QUEUE[element.x] += parseInt(element.y);
			//FLUSH_IDS_QUEUE.push(element.id);
	
			$('#'+element.id).addClass('flushed');
			
			console.info("element %o marked for flush", element.id);
			
			var animal_neighbor = false;
			
			// Mark vertically ?
			if (mode == 'ALL' || mode == 'UP'){
				animal_neighbor = element.up(1);
				if (animal_neighbor && animal_neighbor.hasClass(animal_class))
					collectFreeElements(animal_neighbor.data('animal'), animal_class, 'UP');
			}
	
			if (mode == 'ALL' || mode == 'DOWN'){
				animal_neighbor = element.down(1);
				if (animal_neighbor && animal_neighbor.hasClass(animal_class))
					collectFreeElements(animal_neighbor.data('animal'), animal_class, 'DOWN');
			}
	
			// Mark horizontally ?
			if (mode == 'ALL' || mode == 'RIGHT'){
				animal_neighbor = element.right(1);
				if (animal_neighbor && animal_neighbor.hasClass(animal_class))
					collectFreeElements(animal_neighbor.data('animal'), animal_class, 'RIGHT');
			}
		
			if (mode == 'ALL' || mode == 'LEFT'){
				animal_neighbor = element.left(1);
				if (animal_neighbor && animal_neighbor.hasClass(animal_class))
					collectFreeElements(animal_neighbor.data('animal'), animal_class, 'LEFT');
			}
		}
		
		function canSwitch(animal1, direction, animal2) {
			return (animal1 && animal2 && {
	        	'S': animal2.up(1),
	        	'N': animal2.down(1),
	        	'W': animal2.right(1),
	        	'E': animal2.left(1)
			}[direction]);
		};
		
		//console.groupCollapsed('Loading game..');
		
		// the game
		PLAYGROUND_POSITION = {
			x: $('#board').offset().left + 5,
			y: $('#board_header').height() + 5
		};
		$("#playground").playground({
			height: PLAYGROUND_PIXEL_SIZE,
			width: PLAYGROUND_PIXEL_SIZE,
			refreshRate: 2,
			keyTracker: false
		});
		
	    console.groupEnd();
	    
		effect = new $.gameQuery.Animation({
			imageURL: 'res/img/effect_star.png',
			type: $.gameQuery.ANIMATION_HORIZONTAL
				| $.gameQuery.ANIMATION_ONCE, 
				numberOfFrame: 9, 
				delta: 30,
				rate: 50
			});
		fillPlayground();
		resetFlushQueue();

		//register the scoring callback
	    $.playground().registerCallback(function(){
	    	$('#playground').trigger('get_score', [ function(score){
	    		console.info('score is %o, goal is %o', score, GAME_DATA.goal_score);
	    	}]);
	    });

	    $.playground().startGame(function(){
	    	
			console.info('Playground loaded: %o', $.playground());

		    setTimeout(function(){ lookForFlush(); }, 1000);
	    });
	};
	
	$('#playground').bind('start_game', function(event, data){
		startGame(data);
	});
	
});

if (!console.groupEnd) console.groupEnd = function(){};
if (!console.groupCollapsed) console.groupCollapsed = function(){};
if (!console.error) console.error = console.log;
if (!console.warn) console.warn = console.log;
