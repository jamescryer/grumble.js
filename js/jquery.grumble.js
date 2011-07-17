(function ($, Mustache, Bubble) {

	// $.fn.bubble.defaults references this object. $.fn.bubble.defaults should be used for extension
	var defaults = {
		text: '', // Accepts html
		angle: 45, // 0-360
		size: 100, // Default size
		sizeRange: [50,100,150,200], // Depending on the amount of text, one of these sizes (px) will be used
		distance: 0,
		type: '', // this string is appended to the bubble CSS classname
		showAfter: 0,
		hideAfter: false,
		hideOnClick: false,
		hideButton: false,
		buttonTemplate: '<div class="bubble-button" style="display:none" title="{{hideText}}">x</div>',
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
				options = $.extend({}, $.fn.bubble.defaults, settings, $me.data('bubble') || {}),
				offset = $me.offset(),
				size = calculateTextHeight(options.size, options.sizeRange, options.text),
				bubble,
				button,
				_private;

			options.top = offset.top + ($me.height());
			options.left = offset.left + ($me.width()/2);

			_private = {

				init: function(){
					bubble = new Bubble({
						text: options.text,
						top: options.top,
						left: options.left,
						angle: options.angle,
						size: size,
						distance: options.distance,
						type: options.type
					});

					if(options.hideButton) this.addButton();

					liveBubbles.push({
						bubble: bubble,
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
					button = $( Mustache.to_html(options.buttonTemplate,{hideText:options.buttonHideText}))
						.css({
							left:bubble.realLeft+size-10,
							top:bubble.realTop+size-10
						})
						.insertAfter(bubble.text);
				},

				rePositionButton: function(){

					if( !button ) return;

					button
						.css({
							left:bubble.realLeft+size-10,
							top:bubble.realTop+size-10
						});
				},

				createFxQueue : function(){
					bubble.bubble.queue('fx');
					bubble.text.queue('fx');
					bubble.bubble.delay(options.showAfter);
					bubble.text.delay(options.showAfter);
					if (button) button.delay(options.showAfter);
				},

				showBubble: function(){
					if($.browser.msie === true){
						bubble.bubble.queue('fx',function(next){
							bubble.bubble.show();
							next();
						});
						bubble.text.queue('fx',function(next){
							bubble.text.show();
							next();
						});
						if(button){
							button.queue('fx',function(next){
								button.show();
								next();
							});
						}
					} else {
						bubble.bubble.fadeTo('fast',1);
						bubble.text.fadeTo('fast',1);
						if(button) button.fadeTo('fast',1);
					}

					bubble.bubble.queue('fx',function(next){
						if(options.hideOnClick) _private.hideOnClick();
						next();
					});

					bubble.bubble.queue('fx',function(next){
						_private.doOnShowCallback();
						next();
					});
				},

				hideBubble: function(){
					bubble.bubble.delay(options.hideAfter);
					bubble.text.delay(options.hideAfter);

					bubble.bubble.queue('fx',function(next){
						_private.doOnBeginHideCallback();
						next();
					});

					if($.browser.msie === true){
						bubble.bubble.queue('fx',function(next){
							bubble.bubble.hide();
							next();
						});
						bubble.bubble.queue('fx',function(next){
							bubble.text.hide();
							next();
						});
						if(button){
							button.queue('fx',function(next){
								button.hide();
								next();
							});
						}
					} else {
						bubble.bubble.fadeOut();
						bubble.text.fadeOut();
						if (button) button.fadeOut();
					}

					bubble.bubble.queue('fx',function(next){
						_private.doOnHideCallback();
						next();
					});
				},

				doOnBeginHideCallback: function(){
					options.onBeginHide(bubble, button);
				},

				doOnHideCallback: function(){
					options.onHide(bubble, button);
				},

				doOnShowCallback: function(){
					options.onShow(bubble, button);
				},

				hideOnClick: function(){
					$(document.body)
						.bind('click.bubble',function(){
							_private.hideBubble(bubble, button);
							$(this).unbind('click.bubble');
						});
				},

				prepareEvents: function(){
					$(window).bind('resize.bubble', function(){
						var offset = $me.offset(),
							top = offset.top + ($me.height()),
							left = offset.left + ($me.width()/2);

						bubble.adjust({
							top: top,
							left: left
						});

						_private.rePositionButton();
					});

					$me.bind('hide.bubble',  function(){
						_private.hideBubble(bubble, button);
						$(this).unbind('hide.bubble');
					});

				}
			};

			_private.init();
        });
	};

	$.fn.bubble.defaults = defaults;

	$(document).bind('keyup.bubble',function(event){ // Pressing the escape key will stop all bubbles
		if(event.keyCode === 27){
			$.each(liveBubbles, function(index,object){
				object.bubble.bubble.clearQueue().hide();
				object.bubble.text.clearQueue().hide();
				if(object.button) object.button.clearQueue().hide();
				object.onHide();
			});
		}
	});

	function calculateTextHeight(defaultSize, range, text){
		var el = $('<div style="position:absolute;visibilty:hidden;width:'+defaultSize+'px;">'+text+'</div>')
					.appendTo($(document.body)),
			height = el.outerHeight()*2+(defaultSize*0.20)/*the 20% is approx padding: could be more clever*/,
			index = range.indexOf(defaultSize);

		el.remove();

		if(height >= defaultSize && range[++index]){
			return calculateTextHeight(range[index], range, text); //WARNING: RECURSION!
		}

		return defaultSize;
	}

}(jQuery, Mustache, Bubble));