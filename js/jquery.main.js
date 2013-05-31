// page init
jQuery(function(){
	// initAjaxTabs();
	initAjaxContent();
});

// init ajax content
function initAjaxContent(){
	initBackgroundResize();
	initFormState();
	initInputs();
}

// init form state
function initFormState(){
	var enableClass = 'enable';
	jQuery('.information').each(function(){
		var form = jQuery(this);
		var inputs = form.find('input:text, textarea');
		var enable = false;
		inputs.bind('keyup blur', function(){
			enable = true;
			inputs.each(function(){
				var input = jQuery(this);
				if (!input.val().length || input.val() === input.prop('defaultValue')) {
					enable = false;
				}
			})
			if (enable) {
				form.addClass(enableClass);
			} else {
				form.removeClass(enableClass);
			}
		})
	})
}

// clear inputs on focus
function initInputs() {
	PlaceholderInput.replaceByOptions({
		// filter options
		clearInputs: true,
		clearTextareas: true,
		clearPasswords: true,
		skipClass: 'default',
		
		// input options
		wrapWithElement: false,
		showUntilTyping: false,
		getParentByClass: false,
		placeholderAttr: 'value'
	});
}

// init ajax tabs
// function initAjaxTabs(){
// 	jQuery('#wrapper').ajaxTabs({
// 		animSpeed: jQuery.browser.msie && jQuery.browser.version < 9 ? 0 : 400,
// 		addToParent: true,
// 		tabLinks: '#nav a',
// 		ajaxHolder: '#main',
// 		onTabLoaded: function(newTab) {
// 			initAjaxContent();
// 		}
// 	});
// }

// background stretching
function initBackgroundResize() {
	jQuery('#main').each(function(){
		var hold = jQuery(this);
		var images = hold.find('.bg-image');
		images.each(function(){
			BackgroundStretcher.stretchImage(this);
		})
		BackgroundStretcher.setBgHolder(this);
		jQuery(window).bind('fontresize', function(e){
			BackgroundStretcher.resizeAll();
		});
	})
}

/*
 * jQuery FontResize Event
 */
jQuery.onFontResize = (function($) {
	$(function() {
		var randomID = 'font-resize-frame-' + Math.floor(Math.random() * 1000);
		var resizeFrame = $('<iframe>').attr('id', randomID).addClass('font-resize-helper');

		// required styles
		resizeFrame.css({
			width: '100em',
			height: '10px',
			position: 'absolute',
			borderWidth: 0,
			top: '-9999px',
			left: '-9999px'
		}).appendTo('body');

		// use native IE resize event if possible
		if (window.attachEvent && !window.addEventListener) {
			resizeFrame.bind('resize', function () {
				$.onFontResize.trigger(resizeFrame[0].offsetWidth / 100);
			});
		}
		// use script inside the iframe to detect resize for other browsers
		else {
			var doc = resizeFrame[0].contentWindow.document;
			doc.open();
			doc.write('<scri' + 'pt>window.onload = function(){var em = parent.jQuery("#' + randomID + '")[0];window.onresize = function(){if(parent.jQuery.onFontResize){parent.jQuery.onFontResize.trigger(em.offsetWidth / 100);}}};</scri' + 'pt>');
			doc.close();
		}
		jQuery.onFontResize.initialSize = resizeFrame[0].offsetWidth / 100;
	});
	return {
		// public method, so it can be called from within the iframe
		trigger: function (em) {
			$(window).trigger("fontresize", [em]);
		}
	};
}(jQuery));

// background stretch module
(function(){
	var isTouchDevice = (/MSIE 10.*Touch/.test(navigator.userAgent)) || ('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch;
	BackgroundStretcher = {
		images: [],
		holders: [],
		viewWidth: 0,
		viewHeight: 0,
		ieFastMode: true,
		stretchBy: 'page', // "window", "page", "block-id", or block
		init: function(){
			this.addHandlers();
			this.resizeAll();
			return this;
		},
		stretchImage: function(origImg) {
			// wrap image and apply smoothing
			var obj = this.prepareImage(origImg);
			
			// handle onload
			var img = new Image();
			img.onload = this.bind(function(){
				obj.iRatio = img.width / img.height;
				this.resizeImage(obj);
			});
			img.src = origImg.src;
			this.images.push(obj);
		},
		prepareImage: function(img) {
			var wrapper = document.createElement('span');
			img.parentNode.insertBefore(wrapper, img);
			wrapper.appendChild(img);
		
			if(/MSIE (6|7|8)/.test(navigator.userAgent) && img.tagName.toLowerCase() === 'img') {
				wrapper.style.position = 'absolute';
				wrapper.style.display = 'block';
				wrapper.style.zoom = 1;
				if(this.ieFastMode) {
					img.style.display = 'none';
					wrapper.style.filter = 'progid:DXImageTransform.Microsoft.AlphaImageLoader(src="'+img.src+'", sizingMethod="scale")'; // enable smoothing in IE6
					return wrapper;
				} else {
					img.style.msInterpolationMode = 'bicubic'; // IE7 smooth fix
					return img;
				}
			} else {
				return img;
			}
		},
		setBgHolder: function(obj) {
			if(this.stretchBy === 'window' || this.stretchBy === 'page') {
				this.holders.push(obj);
				this.resizeAll();
			}
		},
		resizeImage: function(obj) {
			if(obj.iRatio) {
				// calculate dimensions
				var dimensions = this.getProportion({
					ratio: obj.iRatio,
					maskWidth: this.viewWidth,
					maskHeight: this.viewHeight
				});
				// apply new styles
				obj.style.width = dimensions.width + 'px';
				obj.style.height = dimensions.height + 'px';
				obj.style.top = dimensions.top + 'px';
				obj.style.left = dimensions.left +'px';
			}
		},
		resizeHolder: function(obj) {
			obj.style.width = this.viewWidth+'px';
			obj.style.height = this.viewHeight+'px';
		},
		getProportion: function(data) {
			// calculate element coords to fit in mask
			var ratio = data.ratio || (data.elementWidth / data.elementHeight);
			var slideWidth = data.maskWidth, slideHeight = slideWidth / ratio;
			if(slideHeight < data.maskHeight) {
				slideHeight = data.maskHeight;
				slideWidth = slideHeight * ratio;
			}
			return {
				width: slideWidth,
				height: slideHeight,
				top: (data.maskHeight - slideHeight) / 2,
				left: (data.maskWidth - slideWidth) / 2
			}
		},
		resizeAll: function() {
			// crop holder width by window size
			for(var i = 0; i < this.holders.length; i++) {
				this.holders[i].style.width = '100%'; 
			}
			
			// delay required for IE to handle resize
			clearTimeout(this.resizeTimer);
			this.resizeTimer = setTimeout(this.bind(function(){
				// hide background holders
				for(var i = 0; i < this.holders.length; i++) {
					this.holders[i].style.display = 'none';
				}
				
				// calculate real page dimensions with hidden background blocks
				if(typeof this.stretchBy === 'string') {
					// resize by window or page dimensions
					if(this.stretchBy === 'window' || this.stretchBy === 'page') {
						this.viewWidth = this.stretchFunctions[this.stretchBy].width();
						this.viewHeight = this.stretchFunctions[this.stretchBy].height();
					}
					// resize by element dimensions (by id)
					else {
						var maskObject = document.getElementById(this.stretchBy);
						this.viewWidth = maskObject ? maskObject.offsetWidth : 0;
						this.viewHeight = maskObject ? maskObject.offsetHeight : 0;
					}
				} else {
					this.viewWidth = this.stretchBy.offsetWidth;
					this.viewHeight = this.stretchBy.offsetHeight;
				}
				
				// show and resize all background holders
				for(i = 0; i < this.holders.length; i++) {
					this.holders[i].style.display = 'block';
					this.resizeHolder(this.holders[i]);
				}
				for(i = 0; i < this.images.length; i++) {
					this.resizeImage(this.images[i]);
				}
			}),10);
		},
		addHandlers: function() {
			if (window.addEventListener) {
				window.addEventListener('resize', this.bind(this.resizeAll), false);
				window.addEventListener('orientationchange', this.bind(this.resizeAll), false);
			} else if (window.attachEvent) {
				window.attachEvent('onresize', this.bind(this.resizeAll));
			}
		},
		stretchFunctions: {
			window: {
				width: function() {
					return typeof window.innerWidth === 'number' ? window.innerWidth : document.documentElement.clientWidth;
				},
				height: function() {
					return typeof window.innerHeight === 'number' ? window.innerHeight : document.documentElement.clientHeight;
				}
			},
			page: {
				width: function() {
					return !document.body ? 0 : Math.max(
						Math.max(document.body.clientWidth, document.documentElement.clientWidth),
						Math.max(document.body.offsetWidth, document.body.scrollWidth)
					);
				},
				height: function() {
					return !document.body ? 0 : Math.max(
						Math.max(document.body.clientHeight, document.documentElement.clientHeight),
						Math.max(document.body.offsetHeight, document.body.scrollHeight)
					);
				}
			}
		},
		bind: function(fn, scope, args) {
			var newScope = scope || this;
			return function() {
				return fn.apply(newScope, args || arguments);
			}
		}
	}.init();
}());

/*
 * jQuery Ajax Tabs plugin
 */
;(function($){
	function AjaxTabs(options) {
		this.options = $.extend({
			holder: null,
			animSpeed: 300,
			addToParent: false,
			activeClass: 'active',
			tabActiveClass: 'page-active',
			tabLinks: 'ul.tabset a',
			ajaxHolder: '.ajax-holder',
			loadingClass: 'ajax-loading'
		}, options);
		this.init();
	}
	AjaxTabs.prototype = {
		init: function() {
			this.findElements();
			this.attachEvents();
		},
		findElements: function() {
			// find structure elements
			this.tabs = $();
			this.holder = $(this.options.holder);
			if(this.holder.length) {
				this.tabLinks = this.holder.find(this.options.tabLinks);
				this.tabLinksParents = this.tabLinks.parent();
				this.ajaxHolder = this.holder.find(this.options.ajaxHolder);
			}
		},
		attachEvents: function() {
			// add handlers
			var self = this;
			this.tabLinks.each(function(){
				var link = $(this);
				link.click(function(e){
					if(!self.animBusy && !self.ajaxBusy && !link.is(self.activeTabLink)) {
						self.switchTab(link);
					}
					e.preventDefault();
				});
			});

			// switch tab to default active link
			var activeLink = this.getActiveLink();
			if(activeLink.length) {
				this.switchTab(activeLink);
			}
		},
		switchTab: function(link) {
			// switch tabs
			var self = this;
			var targetURL = link.attr('href');
			var currentTabs = this.ajaxHolder.children();
			var loadedTab = currentTabs.filter('[data-tab="'+targetURL+'"]');
			var previousActiveTab = currentTabs.filter('.'+this.options.tabActiveClass);

			// change tabs with animation
			if(loadedTab.length) {
				this.changeTabs(previousActiveTab, loadedTab);
			} else {
				this.loadTab(targetURL, function(newTab){
					this.changeTabs(previousActiveTab, newTab);

					// make external callback
					if(typeof self.options.onTabLoaded === 'function') {
						self.options.onTabLoaded.call(self, newTab);
					}
				});
			}

			// refresh link classes
			this.activeTabLink = link;
			this.refreshClasses();
		},
		loadTab: function(tabURL, callback) {
			// load ajax tab content
			var self = this;
			this.holder.addClass(this.options.loadingClass);
			this.ajaxBusy = true;
			$.ajax({
				url: tabURL,
				dataType: 'text',
				success: function(tabHTML) {
					// create tab block
					var newTab = self.createTab(tabHTML, tabURL);
					self.holder.removeClass(self.options.loadingClass);
					self.ajaxBusy = false;
					if(typeof callback === 'function') {
						callback.call(self, newTab);
					}
				},
				error: function() {
					// display error message
					self.holder.removeClass(self.options.loadingClass);
					self.ajaxBusy = false;
					alert('AJAX Error!');
				}
			});
		},
		changeTabs: function(oldTab, newTab, callback) {
			newTab.hide();
			this.animateTab(oldTab.removeClass(this.options.tabActiveClass), false, function() {
				this.animateTab(newTab.addClass(this.options.tabActiveClass), true, function(){
					if(typeof callback === 'function');
				});
			});
		},
		animateTab: function(tab, state, callback) {
			// toggle tab visibility
			var self = this;
			this.animBusy = true;
			if(tab.length) {
				tab[state ? 'fadeIn' : 'fadeOut'](this.options.animSpeed, function(){
					self.animBusy = false;
					if(typeof callback === 'function') {
						callback.call(self);
					}	
				});
			} else {
				self.animBusy = false;
				if(typeof callback === 'function') {
					callback.call(self);
				}
			}
		},
		createTab: function(tabHTML, tabURL) {
			// create tab and return its body
			return $('<div class="section" />').attr('data-tab', tabURL).html(tabHTML).appendTo(this.ajaxHolder);
		},
		getActiveLink: function() {
			// get current active link (if present)
			if(Hash.get()) {
				return this.tabLinks.filter('[href="'+ Hash.get() +'"]');
			} else {
				if(this.options.addToParent) {
					var activeParent = this.tabLinksParents.filter('.' + this.options.activeClass);
					return this.tabLinks.eq(this.tabLinksParents.index(activeParent));
				} else {
					return this.tabLinks.filter('.' + this.options.activeClass);
				}
			}
		},
		refreshClasses: function() {
			// update active classes
			if(this.options.addToParent) {
				this.tabLinksParents.removeClass(this.options.activeClass);
				this.activeTabLink.parent().addClass(this.options.activeClass);
			} else {
				this.tabLinks.removeClass(this.options.activeClass);
				this.activeTabLink.addClass(this.options.activeClass);
			}
			
			// update hash
			Hash.set(this.activeTabLink.attr('href'));
		}
	}

	// jQuery plugin interface
	$.fn.ajaxTabs = function(options) {
		return this.each(function() {
			$(this).data('AjaxTabs', new AjaxTabs($.extend(options, {holder: this})));
		});
	}
}(jQuery));

// Hash history utility module
Hash = {
	init: function() {
		this._handlers = [];
		this.initChangeHandler();
		return this;
	},
	hashChangeSupported: (function(){
		return 'onhashchange' in window && (document.documentMode === undefined || document.documentMode > 7);
	})(),
	initChangeHandler: function() {
		var needFrame = /(MSIE 6|MSIE 7)/.test(navigator.userAgent);
		var delay = 200, instance = this, oldHash, newHash, frameHash;
		frameHash = oldHash = newHash = location.hash;
		
		// create iframe if needed
		if(needFrame) {
			this.fixFrame = document.createElement('iframe');
			this.fixFrame.style.display = 'none';
			document.documentElement.insertBefore(this.fixFrame,document.documentElement.childNodes[0]);
			this.fixFrame.contentWindow.document.open();
			this.fixFrame.contentWindow.document.close();
			this.fixFrame.contentWindow.location.hash = oldHash;
		}
		
		// change listener
		if(this.hashChangeSupported) {
			function changeHandler() {
				newHash = location.hash;
				instance.makeCallbacks(newHash, oldHash);
				oldHash = newHash;
			}
			if(window.addEventListener) window.addEventListener('hashchange',changeHandler, false);
			else if(window.attachEvent) window.attachEvent('onhashchange',changeHandler);
		} else {
			setInterval(function(){
				newHash = location.hash;
				frameHash = needFrame ? instance.fixFrame.contentWindow.location.hash : null;
				// handle iframe history
				if(needFrame && newHash.length && newHash !== frameHash && frameHash.length) {
					location.hash = frameHash;
				}
				// common handler
				if(oldHash != newHash) {
					// handle callbacks
					instance.makeCallbacks(newHash, oldHash);
					oldHash = newHash;
				}
			},delay);
		}
	},
	makeCallbacks: function() {
		for(var i = 0; i < this._handlers.length; i++) {
			this._handlers[i].apply(this, arguments);
		}
	},
	get: function() {
		return location.hash.substr(1);
	},
	set: function(text) {
		if(this.get() != text) {
			location.hash = text;
			if(this.fixFrame) {
				this.fixFrame.contentWindow.document.open();
				this.fixFrame.contentWindow.document.close();
				this.fixFrame.contentWindow.document.location.hash = text;
			}
		}
	},
	clear: function() {
		this.set('');
	},
	onChange: function(handler) {
		this._handlers.push(handler);
	}
}.init();

// placeholder class
;(function(){
	var placeholderCollection = [];
	PlaceholderInput = function() {
		this.options = {
			element:null,
			showUntilTyping:false,
			wrapWithElement:false,
			getParentByClass:false,
			showPasswordBullets:false,
			placeholderAttr:'value',
			inputFocusClass:'focus',
			inputActiveClass:'text-active',
			parentFocusClass:'parent-focus',
			parentActiveClass:'parent-active',
			labelFocusClass:'label-focus',
			labelActiveClass:'label-active',
			fakeElementClass:'input-placeholder-text'
		};
		placeholderCollection.push(this);
		this.init.apply(this,arguments);
	};
	PlaceholderInput.refreshAllInputs = function(except) {
		for(var i = 0; i < placeholderCollection.length; i++) {
			if(except !== placeholderCollection[i]) {
				placeholderCollection[i].refreshState();
			}
		}
	};
	PlaceholderInput.replaceByOptions = function(opt) {
		var inputs = [].concat(
			convertToArray(document.getElementsByTagName('input')),
			convertToArray(document.getElementsByTagName('textarea'))
		);
		for(var i = 0; i < inputs.length; i++) {
			if(inputs[i].className.indexOf(opt.skipClass) < 0) {
				var inputType = getInputType(inputs[i]);
				var placeholderValue = inputs[i].getAttribute('placeholder');
				if(opt.focusOnly || (opt.clearInputs && (inputType === 'text' || inputType === 'email' || placeholderValue)) ||
					(opt.clearTextareas && inputType === 'textarea') ||
					(opt.clearPasswords && inputType === 'password')
				) {
					new PlaceholderInput({
						element:inputs[i],
						focusOnly: opt.focusOnly,
						wrapWithElement:opt.wrapWithElement,
						showUntilTyping:opt.showUntilTyping,
						getParentByClass:opt.getParentByClass,
						showPasswordBullets:opt.showPasswordBullets,
						placeholderAttr: placeholderValue ? 'placeholder' : opt.placeholderAttr
					});
				}
			}
		}
	};
	PlaceholderInput.prototype = {
		init: function(opt) {
			this.setOptions(opt);
			if(this.element && this.element.PlaceholderInst) {
				this.element.PlaceholderInst.refreshClasses();
			} else {
				this.element.PlaceholderInst = this;
				if(this.elementType !== 'radio' || this.elementType !== 'checkbox' || this.elementType !== 'file') {
					this.initElements();
					this.attachEvents();
					this.refreshClasses();
				}
			}
		},
		setOptions: function(opt) {
			for(var p in opt) {
				if(opt.hasOwnProperty(p)) {
					this.options[p] = opt[p];
				}
			}
			if(this.options.element) {
				this.element = this.options.element;
				this.elementType = getInputType(this.element);
				if(this.options.focusOnly) {
					this.wrapWithElement = false;
				} else {
					if(this.elementType === 'password' && this.options.showPasswordBullets) {
						this.wrapWithElement = false;
					} else {
						this.wrapWithElement = this.elementType === 'password' || this.options.showUntilTyping ? true : this.options.wrapWithElement;
					}
				}
				this.setPlaceholderValue(this.options.placeholderAttr);
			}
		},
		setPlaceholderValue: function(attr) {
			this.origValue = (attr === 'value' ? this.element.defaultValue : (this.element.getAttribute(attr) || ''));
			if(this.options.placeholderAttr !== 'value') {
				this.element.removeAttribute(this.options.placeholderAttr);
			}
		},
		initElements: function() {
			// create fake element if needed
			if(this.wrapWithElement) {
				this.fakeElement = document.createElement('span');
				this.fakeElement.className = this.options.fakeElementClass;
				this.fakeElement.innerHTML += this.origValue;
				this.fakeElement.style.color = getStyle(this.element, 'color');
				this.fakeElement.style.position = 'absolute';
				this.element.parentNode.insertBefore(this.fakeElement, this.element);
				
				if(this.element.value === this.origValue || !this.element.value) {
					this.element.value = '';
					this.togglePlaceholderText(true);
				} else {
					this.togglePlaceholderText(false);
				}
			} else if(!this.element.value && this.origValue.length) {
				this.element.value = this.origValue;
			}
			// get input label
			if(this.element.id) {
				this.labels = document.getElementsByTagName('label');
				for(var i = 0; i < this.labels.length; i++) {
					if(this.labels[i].htmlFor === this.element.id) {
						this.labelFor = this.labels[i];
						break;
					}
				}
			}
			// get parent node (or parentNode by className)
			this.elementParent = this.element.parentNode;
			if(typeof this.options.getParentByClass === 'string') {
				var el = this.element;
				while(el.parentNode) {
					if(hasClass(el.parentNode, this.options.getParentByClass)) {
						this.elementParent = el.parentNode;
						break;
					} else {
						el = el.parentNode;
					}
				}
			}
		},
		attachEvents: function() {
			this.element.onfocus = bindScope(this.focusHandler, this);
			this.element.onblur = bindScope(this.blurHandler, this);
			if(this.options.showUntilTyping) {
				this.element.onkeydown = bindScope(this.typingHandler, this);
				this.element.onpaste = bindScope(this.typingHandler, this);
			}
			if(this.wrapWithElement) this.fakeElement.onclick = bindScope(this.focusSetter, this);
		},
		togglePlaceholderText: function(state) {
			if(!this.element.readOnly && !this.options.focusOnly) {
				if(this.wrapWithElement) {
					this.fakeElement.style.display = state ? '' : 'none';
				} else {
					this.element.value = state ? this.origValue : '';
				}
			}
		},
		focusSetter: function() {
			this.element.focus();
		},
		focusHandler: function() {
			clearInterval(this.checkerInterval);
			this.checkerInterval = setInterval(bindScope(this.intervalHandler,this), 1);
			this.focused = true;
			if(!this.element.value.length || this.element.value === this.origValue) {
				if(!this.options.showUntilTyping) {
					this.togglePlaceholderText(false);
				}
			}
			this.refreshClasses();
		},
		blurHandler: function() {
			clearInterval(this.checkerInterval);
			this.focused = false;
			if(!this.element.value.length || this.element.value === this.origValue) {
				this.togglePlaceholderText(true);
			}
			this.refreshClasses();
			PlaceholderInput.refreshAllInputs(this);
		},
		typingHandler: function() {
			setTimeout(bindScope(function(){
				if(this.element.value.length) {
					this.togglePlaceholderText(false);
					this.refreshClasses();
				}
			},this), 10);
		},
		intervalHandler: function() {
			if(typeof this.tmpValue === 'undefined') {
				this.tmpValue = this.element.value;
			}
			if(this.tmpValue != this.element.value) {
				PlaceholderInput.refreshAllInputs(this);
			}
		},
		refreshState: function() {
			if(this.wrapWithElement) {
				if(this.element.value.length && this.element.value !== this.origValue) {
					this.togglePlaceholderText(false);
				} else if(!this.element.value.length) {
					this.togglePlaceholderText(true);
				}
			}
			this.refreshClasses();
		},
		refreshClasses: function() {
			this.textActive = this.focused || (this.element.value.length && this.element.value !== this.origValue);
			this.setStateClass(this.element, this.options.inputFocusClass,this.focused);
			this.setStateClass(this.elementParent, this.options.parentFocusClass,this.focused);
			this.setStateClass(this.labelFor, this.options.labelFocusClass,this.focused);
			this.setStateClass(this.element, this.options.inputActiveClass, this.textActive);
			this.setStateClass(this.elementParent, this.options.parentActiveClass, this.textActive);
			this.setStateClass(this.labelFor, this.options.labelActiveClass, this.textActive);
		},
		setStateClass: function(el,cls,state) {
			if(!el) return; else if(state) addClass(el,cls); else removeClass(el,cls);
		}
	};
	
	// utility functions
	function convertToArray(collection) {
		var arr = [];
		for (var i = 0, ref = arr.length = collection.length; i < ref; i++) {
			arr[i] = collection[i];
		}
		return arr;
	}
	function getInputType(input) {
		return (input.type ? input.type : input.tagName).toLowerCase();
	}
	function hasClass(el,cls) {
		return el.className ? el.className.match(new RegExp('(\\s|^)'+cls+'(\\s|$)')) : false;
	}
	function addClass(el,cls) {
		if (!hasClass(el,cls)) el.className += " "+cls;
	}
	function removeClass(el,cls) {
		if (hasClass(el,cls)) {el.className=el.className.replace(new RegExp('(\\s|^)'+cls+'(\\s|$)'),' ');}
	}
	function bindScope(f, scope) {
		return function() {return f.apply(scope, arguments);};
	}
	function getStyle(el, prop) {
		if (document.defaultView && document.defaultView.getComputedStyle) {
			return document.defaultView.getComputedStyle(el, null)[prop];
		} else if (el.currentStyle) {
			return el.currentStyle[prop];
		} else {
			return el.style[prop];
		}
	}
}());