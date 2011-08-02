/**   (c) 2011 James Cryer, Huddle (www.huddle.com) 	*/
/**   http://jamescryer.github.com/grumble.js/ 		*/

(function ($, Bubble) {

	// $.fn.grumble.defaults references this object. $.fn.grumble.defaults should be used for extension
	var defaults = {
		text: '', // Accepts html
		angle: 45, // 0-360
		size: 50, // Default size
		sizeRange: [50,100,150,200], // Depending on the amount of text, one of these sizes (px) will be used
		distance: 0,
		type: '', // this string is appended to the bubble CSS classname
		showAfter: 0,
		hideAfter: false,
		hideOnClick: false,
		hasHideButton: false,
		buttonTemplate: '<div class="grumble-button" style="display:none" title="{hideText}">x</div>',
		buttonHideText: 'Hide',
		onHide: function(){},
		onShow: function(){},
		onBeginHide: function(){}
	},
	liveBubbles = [];

    $.fn.grumble = function (settings) {

		if( typeof settings === 'string' ){
			this.trigger({type:settings+'.bubble'});
			return this;
		}

		return this.each(function () {
            var $me = $(this),
				options = $.extend({}, $.fn.grumble.defaults, settings, $me.data('bubble') || {}),
				offset = $me.offset(),
				size = calculateTextHeight(options.size, options.sizeRange, options.text),
				grumble,
				button,
				_private;

			options.top = offset.top + ($me.height());
			options.left = offset.left + ($me.width()/2);

			_private = {

				init: function(){
					grumble = new Bubble({
						text: options.text,
						top: options.top,
						left: options.left,
						angle: options.angle,
						size: size,
						distance: options.distance,
						type: options.type
					});

					if(options.hasHideButton) this.addButton();

					liveBubbles.push({
						grumble: grumble,
						button: button,
						onHide: function(){
							_private.doOnBeginHideCallback();
							_private.doOnHideCallback();
						}
					});

					if(options.showAfter) this.createFxQueue();
					this.showBubble();
					if(options.hideAfter) this.hideBubble();
					this.prepareEvents();
				},

				addButton: function(){
					var tmpl = Bubble.prototype.tmpl;
				
					// I think this code smells.. Responsibility for the view should be in the same place.
					// Could possibly move this into bubble.js
					// or extract all view logic into a third component
					button = $( tmpl(options.buttonTemplate,{hideText:options.buttonHideText}))
						.css({
							left:grumble.realLeft+size-10,
							top:grumble.realTop+size-10
						})
						.insertAfter(grumble.text);
				},

				rePositionButton: function(){

					if( !button ) return;

					button
						.css({
							left:grumble.realLeft+size-10,
							top:grumble.realTop+size-10
						});
				},

				createFxQueue : function(){
					grumble.bubble.queue('fx');
					grumble.text.queue('fx');
					grumble.bubble.delay(options.showAfter);
					grumble.text.delay(options.showAfter);
					if (button) button.delay(options.showAfter);
				},

				showBubble: function(){
					if($.browser.msie === true){
						grumble.bubble.queue('fx',function(next){
							grumble.bubble.show();
							next();
						});
						grumble.text.queue('fx',function(next){
							grumble.text.show();
							next();
						});
						if(button){
							button.queue('fx',function(next){
								button.show();
								next();
							});
						}
					} else {
						grumble.bubble.fadeTo('fast',1);
						grumble.text.fadeTo('fast',1);
						if(button) button.fadeTo('fast',1);
					}

					grumble.bubble.queue('fx',function(next){
						if(options.hideOnClick || options.hasHideButton) _private.hideOnClick();
						next();
					});

					grumble.bubble.queue('fx',function(next){
						_private.doOnShowCallback();
						next();
					});
				},

				hideBubble: function(){
					grumble.bubble.delay(options.hideAfter);
					grumble.text.delay(options.hideAfter);

					grumble.bubble.queue('fx',function(next){
						_private.doOnBeginHideCallback();
						next();
					});

					if($.browser.msie === true){
						grumble.bubble.queue('fx',function(next){
							grumble.bubble.hide();
							next();
						});
						grumble.bubble.queue('fx',function(next){
							grumble.text.hide();
							next();
						});
						if(button){
							button.queue('fx',function(next){
								button.hide();
								next();
							});
						}
					} else {
						grumble.bubble.fadeOut();
						grumble.text.fadeOut();
						if (button) button.fadeOut();
					}

					grumble.bubble.queue('fx',function(next){
						_private.doOnHideCallback();
						next();
					});
				},

				doOnBeginHideCallback: function(){
					options.onBeginHide(grumble, button);
				},

				doOnHideCallback: function(){
					options.onHide(grumble, button);
				},

				doOnShowCallback: function(){
					options.onShow(grumble, button);
				},

				hideOnClick: function(){
					$(document.body)
						.bind('click.bubble',function(){
							_private.hideBubble(grumble, button);
							//$(this).unbind('click.bubble');
						});
				},

				prepareEvents: function(){
					$(window).bind('resize.bubble', function(){
						var offset = $me.offset(),
							top = offset.top + ($me.height()),
							left = offset.left + ($me.width()/2);

						grumble.adjust({
							top: top,
							left: left
						});

						_private.rePositionButton();
					});

					$me.bind('hide.bubble',  function(){
						_private.hideBubble(grumble, button);
						$(this).unbind('hide.bubble');
					});

				}
			};

			_private.init();
        });
	};

	$.fn.grumble.defaults = defaults;

	$(document).bind('keyup.bubble',function(event){ // Pressing the escape key will stop all bubbles
		if(event.keyCode === 27){
			$.each(liveBubbles, function(index,object){
				object.grumble.bubble.clearQueue().hide();
				object.grumble.text.clearQueue().hide();
				if(object.button) object.button.clearQueue().hide();
				object.onHide();
			});
		}
	});

	function calculateTextHeight(defaultSize, range, text){
		var el = $('<div style="position:absolute;visibilty:hidden;width:'+defaultSize+'px;">'+text+'</div>')
					.appendTo($(document.body)),
			height = el.outerHeight()*2+(defaultSize*0.20),/*the 20% is approx padding: could be more clever*/
			index = $.inArray(defaultSize, range);

		el.remove();

		if(height >= defaultSize && range[++index]){
			return calculateTextHeight(range[index], range, text); //WARNING: RECURSION!
		}

		return defaultSize;
	}

}(jQuery, Bubble));