$(function(){

	// TODO: depends on "size" parameter (location.search)
	var params = location.search.replace(/^\?/, '').split('=');
	console.log('params = %o', params);
	var PLAYGROUND_SIDE = 10;

	var TILE_SIZE = 30;
	var PLAYGROUND_PIXEL_SIZE = PLAYGROUND_SIDE * TILE_SIZE;
	var PLAYGROUND_POSITION = { x:5, y:50 };
	var PLAYGROUND_ANIMALS = new Array();
	for (var x=0; x<PLAYGROUND_SIDE; PLAYGROUND_ANIMALS[x++] = new Array());
	
	var PLAYERMOVES = 0;
	
	var CURRENT_ANIMAL = false;
	
	var FLUSH_IDS_QUEUE = new Array();
	var FLUSH_QUEUE = new Array();
	for (var y=0; y<PLAYGROUND_SIDE; FLUSH_QUEUE.push(0)) y++;

	var Q = $('body');
	var qname = 'QUEUE_ITEM';
	
	var ANIMALS = [
       { img: 'res/img/blowfish.png', animal_class: 'blowfish' },
       { img: 'res/img/ladybug.png', animal_class: 'ladybug' },
       { img: 'res/img/whale.png', animal_class: 'whale' },
       { img: 'res/img/cat.png', animal_class: 'cat' },
       { img: 'res/img/owl.png', animal_class: 'owl' }
/* * /,
       { img: 'res/img/cat.png', animal_class: 'cat1' },
       { img: 'res/img/cat.png', animal_class: 'cat2' },
       { img: 'res/img/cat.png', animal_class: 'cat3' },
       { img: 'res/img/cat.png', animal_class: 'cat4' },
       { img: 'res/img/cat.png', animal_class: 'cat5' },
       { img: 'res/img/cat.png', animal_class: 'cat6' },
       { img: 'res/img/cat.png', animal_class: 'cat7' },
       { img: 'res/img/cat.png', animal_class: 'cat8' }
/* */
    ];

	// this is a methods that returns a random element from the given array
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
        	console.log('Ooops, someone is missing among target_element(%o) , aimed_element(%o), target_animal(%o) or aimed_animal(%o)',
        			target_element.lenght<1, aimed_element.lenght<1, target_animal==null, aimed_animal==null);
        	// revert the action
        	console.groupEnd();
        	return true;
        }
        
        // see if it fits
        var in_row = aimed_element && aimed_element.data('animal').isInRow(
        		target_animal.animal_def.animal_class, inverseDirection(direction));
        if (aimed_element && in_row) {
			console.log('Yeah, go switch %o and %o, a row of %o will occur on %o, direction was %o', 
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
			console.log('No! WTF are you trying to do ?');

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
		
        console.log('%o should go to (%o,%o)', aimed_element.attr('id'), aimed_animal.x, aimed_animal.y);

        console.log('%o is now ..', aimed_element.attr('id'));
        aimed_animal.id = 'animal-'+aimed_animal.x+'-'+aimed_animal.y;
        aimed_element.attr('id', aimed_animal.id);
        console.log('.. %o', aimed_element.attr('id'));

        console.log('%o should go to (%o,%o)', target_element.attr('id'), target_animal.x, target_animal.y);

        console.log('%o is now ..', target_element.attr('id'));
        target_animal.id = 'animal-'+target_animal.x+'-'+target_animal.y;
        target_element.attr('id', target_animal.id);
        console.log('.. %o', target_element.attr('id'));
        
        return [ target_element, target_animal, aimed_element, aimed_animal ];
    }
    
    function createAnimal(x, y, name, animal, tag){
    	if (!tag) tag = new Date().toUTCString();
    	
    	$.playground().addSprite(name, {
			posx: (x*TILE_SIZE)+PLAYGROUND_POSITION.x,
			posy: (y*TILE_SIZE)+PLAYGROUND_POSITION.y,
			height: TILE_SIZE,
			width: TILE_SIZE,
			animation: new $.gameQuery.Animation({ imageURL: animal.img, type: $.gameQuery.ANIMATION_VERTICAL, numberOfFrame: 1, delta: 30 })
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
			.draggableXYE({
			    revert: true,
			    dynamic: false,
			    reloads: true,
			    stop: onPlayerMove
			});	
    	
    	console.log("Add a %o named %o on %o:%o", animal.animal_class, name, x, y);
    	
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
	
	function flushCommit_clear_animals(){
		var flushed = $('.flushed');
		
		$('#playground').trigger('player_move_flushed', [ flushed ]);

		$.map(flushed, function(element_to_flush){
			element_to_flush = $(element_to_flush);
			if (element_to_flush.attr('id').match(/animal-\d-\d-/)) return;
			
			var animal = element_to_flush.data('animal');
			var new_id = element_to_flush.attr('id')+'-clearing';
			animal.rename(new_id);

			// Animate, and dismiss element
			Q.queue(qname, function(next){
				console.log('Animate %o for clearing', this.attr('id'));
				this.animate({zoom:2, top:PLAYGROUND_PIXEL_SIZE/3, left:PLAYGROUND_PIXEL_SIZE/3}, 500, function(){
					var animal = $(this).data('animal');
					$(this).remove();
					
					if (!animal){
						//debugger;
					}
					else{
						createAnimal(animal.x, animal.y, 'animal-'+animal.x+'-'+animal.y, random(ANIMALS), 'MOVE_'+PLAYERMOVES);
					}
					
					next();
				});
			}.bind(element_to_flush));
		});
	}

	function flushCommit(callback){
		flushCommit_clear_animals();
		
		Q.queue(qname, resetFlushQueue);
		Q.queue(qname, callback);
		
		Q.dequeue(qname);
		Q.dequeue(qname);
		return;
		
		
		/*
		for (var x=0; x<FLUSH_QUEUE.length; x++) {
			var nb_flushed = 0;
			new_animals_queue[x] = 0;

			for (var y=PLAYGROUND_SIDE-1; y>=0; y--){
				var element = jQuery('#'+PLAYGROUND_ANIMALS[x][y].id);
				var animal = element.data('animal');

				if (element.attr('id').match(/animal-\d-\d-/)) continue;
				
				// If marked for flush
				if (PLAYGROUND_ANIMALS[x][y].marked_for_flush){
					
					// Add a new element on queue
					nb_flushed++;
					new_animals_queue[x]++
					
					var new_id = element.attr('id')+'-clearing';
					animal.rename(new_id);
					element = $('#'+new_id);
					
				}
				else if (nb_flushed == 0){
					// nothing to do yet
				}
				else {
					// Rename the element
					var new_id = element.attr('id')+'-moving';
					animal.rename(new_id);
					var element = $('#'+new_id);
					element.data('new_position', { x:x, y:y+nb_flushed });
					
					Q.queue(qname, function(next){
						
						// Animate the element down
						console.log("Animal %o tagged %o gonna move !", this.attr('id'), animal.tag);
						this.animate({top: '+=' + (nb_flushed * TILE_SIZE) }, 200, 'linear', function(){
							// FIXME: "this" is NOT the referenced "element" ?! 
							var me = $(this);
							
							var thisanimal = me.data('animal');
							
							//if ('MOVE_'+flush_on_player_move != thisanimal.tag) debugger;
	
							// re-set position
							var new_position = me.data('new_position');
							if (new_position) {
								//console.log("animal %o (previously on %o:%o) is now on %o:%o", thisanimal.id, thisanimal.x, thisanimal.y, new_position.x, new_position.y)
								thisanimal.reposition(new_position.x, new_position.y);
							}
							else {
								debugger;
							}
							
							next();
						});
					
					}.bind(element));
					Q.delay(100, qname);
				}
			}
		}
		
		Q.queue(qname, function(){ console.log('create animals'); });
		Q.delay(200);
		
		
		//setTimeout(function(){
			for (var x=0; x<new_animals_queue.length; x++){
				//console.log("Exec queue item #%o : %o", i, new_animals_queue[i]+'');
				//new_animals_queue[i]();
				//console.log('I should add %o animals in column %o', new_animals_queue[x], x);
				for (var w=0; w<new_animals_queue[x]; w++){
					Q.queue(qname, function(next){
						createAnimal(this.x, this.w, 'animal-'+this.x+'-'+this.w, random(ANIMALS), 'MOVE_'+PLAYERMOVES);
						next();
					}.bind({ x:x, w:w }));
					Q.delay(100, qname);
				}
			}
			
			//if (typeof(callback)=='function') callback();
			Q.queue(qname, callback);
			
		//}, 200);

		Q.queue(qname, resetFlushQueue);
			
		Q.dequeue(qname);
		*/
	};
	
	function lookForFlush(start_x, start_y){
		//debugger;
		if (!start_x) start_x = 0;
		if (!start_y) start_y = 0;
		console.log("looking for elements to flush");
		for (var x=start_x; x<PLAYGROUND_SIDE; x++){
			for (var y=start_y; y<PLAYGROUND_SIDE; y++){
				var element = $('#'+PLAYGROUND_ANIMALS[x][y].id);
				var animal = element.data('animal');
				
				if (!element.hasClass('flushed') && animal.isInRow(animal.animal_def.animal_class))
					collectFreeElements(animal, animal.animal_def.animal_class, 'ALL');
			}
		}

		if (flushQueueSize() > 0){
			console.log("commit !");
			//debugger;
			//flushCommit();
			flushCommit(function(){ lookForFlush(); });
			//return;
			//break;
		}
		else {
			console.log("Seems clean, bye");
		}
	};
	
	function flushQueueSize(){
		return $('.flushed').length;
		
		var lengths = $.map(FLUSH_QUEUE, function(e){ return e; });
		var sum = 0;
		for (var i=0,sum=0; i<FLUSH_QUEUE.length; sum+=parseInt(FLUSH_QUEUE[i++]));
		console.log('%o objects in flushing queue', sum);
		return sum;
	};
	
	function collectFreeElements(element, animal_class, mode){
		
		if (!element || !element.hasClass(animal_class) || element.hasClass('flushed') || FLUSH_IDS_QUEUE.indexOf(element.id)>=0) return;
		element.marked_for_flush = true;
		FLUSH_QUEUE[element.x] += parseInt(element.y);
		//FLUSH_IDS_QUEUE.push(element.id);

		$('#'+element.id).addClass('flushed');
		
		console.log("element %o marked for flush", element.id);
		
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
	
	console.groupCollapsed('Loading game..');
	
	// the game
	$("#playground").playground({height: PLAYGROUND_PIXEL_SIZE, width: PLAYGROUND_PIXEL_SIZE, refreshRate: 2, keyTracker: false});

	console.log('Playground loaded: %o', $.playground());

	//register the main callback
    // $.playground().registerCallback(function(){});

    console.groupEnd();

	fillPlayground();
	resetFlushQueue();
	
    $.playground().startGame(function(){
    	
    });
    
    
    setTimeout(function(){ lookForFlush(); }, 1000);
});
