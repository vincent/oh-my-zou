/**
 * Code by darthjdg
 * http://stackoverflow.com/questions/6398854/jquery-draggable-with-ease
 * http://jsfiddle.net/4C9p2
 */
$.fn.draggableXYE = function(options) {
    var defaultOptions = {
        distance: 5,
        dynamic: false
    };
    options = $.extend(defaultOptions, options);
    
    // ADDED: Store startPosition for reverting
    var startPosition = this.position();

    // ADDED: Function to apply easing to passed element
    function AnimateElement(element, newpos) {
        $(element).stop().animate({
            top: newpos.top,
            left: newpos.left
        }, 200, 'easeOutCirc');
    }

    this.draggable({
        distance: options.distance,
        // ADDED: Helper function to create invisible helper
        helper: function(){
            return $('<div></div>').css('opacity',0);
        },
        start: function(event, ui) {
        	var newposition = ui.position || {
                top: 0,
                left: 0
            };
            ui.helper.data('draggableXY.originalPosition', newposition);
        	// console.log('start at %o', ui.position);
        	
        	if (options.reloads){
        		startPosition = jQuery(this).position();
        		// console.log('startPosition reset at %o', startPosition);
            }
        	
            ui.helper.data('draggableXY.newDrag', true);
        },
        drag: function(event, ui) {
            var originalPosition = ui.helper.data('draggableXY.originalPosition');
            var deltaX = Math.abs(originalPosition.left - ui.position.left);
            var deltaY = Math.abs(originalPosition.top - ui.position.top);

            var newDrag = options.dynamic || ui.helper.data('draggableXY.newDrag');
            ui.helper.data('draggableXY.newDrag', false);

            var xMax = newDrag ? Math.max(deltaX, deltaY) === deltaX : ui.helper.data('draggableXY.xMax');
            ui.helper.data('draggableXY.xMax', xMax);

            var newPosition = ui.position;
            if (xMax) {
                newPosition.top = originalPosition.top;
                ui.helper.data('draggableXY.direction', (originalPosition.left - ui.position.left) > 0 ? 'W' : 'E');
            }
            if (!xMax) {
                newPosition.left = originalPosition.left;
                ui.helper.data('draggableXY.direction', (originalPosition.top - ui.position.top) > 0 ? 'N' : 'S');
            }
            
            // ADDED: Animate original object with easing to new position
            AnimateElement(this, newPosition);

            return newPosition;
        },
        // ADDED: Stop event to support reverting
        stop: function(event, ui) {
            if (options.revert && options.stop(event, ui)){
            	// console.log('revert to %o', startPosition);
            	AnimateElement(this, startPosition);
            }
        }
    });
};