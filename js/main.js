// page init
bindReady(function(){
	initBackgroundResize();
	initInputs();
});

// background stretching
function initBackgroundResize() {
	var holder = document.getElementById('bg');
	if(holder) {
		var images = holder.getElementsByTagName('img');
		for(var i = 0; i < images.length; i++) {
			BackgroundStretcher.stretchImage(images[i]);
		}
		BackgroundStretcher.setBgHolder(holder);
		
		// handle font resize
		FontResizeEvent.onChange(function(e){
			BackgroundStretcher.resizeAll();
		});
	}
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

/*
 * FontResize Event
 */
FontResizeEvent = (function(window,document){
	var randomID = 'font-resize-frame-' + Math.floor(Math.random() * 1000);
	var resizeFrame = document.createElement('iframe');
	resizeFrame.id = randomID; resizeFrame.className = 'font-resize-helper';
	resizeFrame.style.cssText = 'position:absolute;width:100em;height:10px;top:-9999px;left:-9999px;border-width:0';

	// wait for page load
	function onPageReady() {
		document.body.appendChild(resizeFrame);

		// use native IE resize event if possible
		if (/MSIE (6|7|8)/.test(navigator.userAgent)) {
			resizeFrame.onresize = function() {
				window.FontResizeEvent.trigger(resizeFrame.offsetWidth / 100);
			};
		}
		// use script inside the iframe to detect resize for other browsers
		else {
			var doc = resizeFrame.contentWindow.document;
			doc.open();
			doc.write('<scri' + 'pt>window.onload = function(){var em = parent.document.getElementById("' + randomID + '");window.onresize = function(){if(parent.FontResizeEvent){parent.FontResizeEvent.trigger(em.offsetWidth / 100);}}};</scri' + 'pt>');
			doc.close();
		}
	}
	if(window.addEventListener) window.addEventListener('load', onPageReady, false);
	else if(window.attachEvent) window.attachEvent('onload', onPageReady);

	// public interface
	var callbacks = [];
	return {
		onChange: function(f) {
			if(typeof f === 'function') {
				callbacks.push(f);
			}
		},
		trigger: function(em) {
			for(var i = 0; i < callbacks.length; i++) {
				callbacks[i](em);
			}
		}
	};
}(this, document));

// DOM ready handler
function bindReady(handler){
	var called = false;
	var ready = function() {
		if (called) return;
		called = true;
		handler();
	};
	if (document.addEventListener) {
		document.addEventListener('DOMContentLoaded', ready, false);
	} else if (document.attachEvent) {
		if (document.documentElement.doScroll && window == window.top) {
			var tryScroll = function(){
				if (called) return;
				if (!document.body) return;
				try {
					document.documentElement.doScroll('left');
					ready();
				} catch(e) {
					setTimeout(tryScroll, 0);
				}
			};
			tryScroll();
		}
		document.attachEvent('onreadystatechange', function(){
			if (document.readyState === 'complete') {
				ready();
			}
		});
	}
	if (window.addEventListener) window.addEventListener('load', ready, false);
	else if (window.attachEvent) window.attachEvent('onload', ready);
}