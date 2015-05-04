(function() {
var eventNamespace = 'scrolly.';
var instances = [];

function extend(a, b) {
	for (var prop in b) {
		a[prop] = b[prop];
	}
	return a;
}

var Scrolly = function(selector, opts) {
	this.opts = extend(this.constructor.defaults, opts || {});
	this.element = document.querySelector(selector);

	var _this = this;
	var trapEnabled = true;
	var scrollTimer = {x: 0, y: 0};
	var prevScrollPos = 0;
	var _event = {
		x: new EventAxis('x'),
		y: new EventAxis('y'),
		axis: null,
		update: function(eventData) {
			var _data = this[this.axis];

			_data.type = eventData.type;
			_data.timestamp = new Date();
			_data.originalEvent = eventData.originalEvent || 'n/a';
			return _data;
		}
	};

	function EventAxis(axis) {
		extend(this, {
			distScrolled: 0,
			scrollEdgeReached: false,
			scrollPos: {
				start: axis === 'y' ? _this.element.scrollTop : _this.element.scrollLeft,
				end: null
			},
			scrollableDist: _this.getScrollableDist()[axis],
		});
	}

	function captureWheel(e) {
		var scrollDirection = [
			e.deltaY > 0,
			e.deltaY < 0,
			e.deltaX > 0,
			e.deltaX < 0
		];
		var scrollDirectionIndex = scrollDirection.indexOf(true);
		var side = scrollDirectionIndex <= 1 ? 'Top' : 'Left';
		var axis = side === 'Top' ? 'y' : 'x'
		var curScrollPos = _this.element['scroll'+side];
		var delta = e['delta'+axis.toUpperCase()];

		_event.axis = axis;

		// only trap events once we've scrolled to the end
		// or beginning
		if (trapEnabled &&
				_this.opts.wheelBlock && (
					(delta>0 && curScrollPos >= _event[axis].scrollableDist) ||
					(delta<0 && curScrollPos <= 0)
				)) {
			_event[axis].scrollEdgeReached = true;
			e.preventDefault();
		}

		_this.emit(eventNamespace+'wheel', _event.update({
			type: eventNamespace+'wheel'
		}));
	}

	function captureScroll(e) {
		var curScrollPos = {
			x: this.scrollLeft,
			y: this.scrollTop
		};
		var axis = '';

		_event.x.distScrolled = Math.abs(_event.x.scrollPos.start - curScrollPos.x);
		_event.y.distScrolled = Math.abs(_event.y.scrollPos.start - curScrollPos.y);
		axis = _event.x.distScrolled ? 'x' : 'y';
		_event.axis = axis;
		_event[axis].scrollEdgeReached = false;

		_this.emit(eventNamespace+'scroll', _event.update({
			type: eventNamespace+'scroll',
			originalEvent: e
		}));

		if (curScrollPos[axis] === _event[axis].scrollableDist || !curScrollPos[axis]) {
			_event[axis].scrollEdgeReached = true;
			_this.emit(eventNamespace+'scrolledgereached', _event.update({
				type: eventNamespace+'scrolledgereached'
			}));
		}

		clearTimeout(scrollTimer[axis]);
		(function(curScrollPos) {
			scrollTimer[axis] = setTimeout(function() {
				_event[axis].scrollPos.end = curScrollPos[axis];

				_this.emit('scrolly.scrollend', _event.update({
					type: eventNamespace+'scrollend'
				}));

				_event[axis].scrollPos.start = curScrollPos[axis];
			}, _this.opts.scrollendDelay || 50);
		})(curScrollPos);
	}

	function enableTrap() {
		var isScrollable = _event.x.scrollableDist || _event.y.scrollableDist;

		if (isScrollable) {
			trapEnabled = true;
		}
	}

	function disableTrap() {
		trapEnabled = false;
	}

	this.setListeners = function(addOrRemove) {
		var setListener = addOrRemove + 'EventListener';

		document[setListener]('wheel', captureWheel);
		this.element[setListener]('scroll', captureScroll);
		this.element[setListener]('mouseleave', disableTrap);
		this.element[setListener]('mouseenter', enableTrap);
	}

	this.listeners = {};
	this.listeners[eventNamespace] = {};

	if (!this.element) {
		console.error('couldn\'t find element \''+selector+'\'');
		return;
	}

	this.setListeners('add');
}

Scrolly.defaults = {
	wheelBlock: false,
	scrollendDelay: 100
};

var proto = Scrolly.prototype;
var Event = function(method) {
	return function(eventType, arg2) {
		if (eventType.match(eventNamespace)) {
			var listeners = this.listeners[eventNamespace];
		} else {
			var listeners = this.listeners;
		}

		if (!Array.isArray(listeners[eventType])) {
			listeners[eventType] = [];
		}

		handlers = listeners[eventType];

		method.call(this, eventType, arg2, handlers);

		return this;
	}
}

proto.getScrollableDist = function() {
	return {
		x: this.element.scrollWidth - this.element.clientWidth,
		y: this.element.scrollHeight - this.element.clientHeight
	}
}

proto.on = Event(function(eventType, handlerFn, handlers) {
	if (handlerFn.toString().match(/querySelector/g)) {
		console.warn(
			'event - \''+eventType+'\'\n'+
			'querySelector in a \'scroll\' event can be a potential performance bottleneck. Use with caution! Try caching your queries instead.\n'+
			'(tips: http://ejohn.org/blog/learning-from-twitter/)'
		);
	}

	if ('on'+eventType in this.element) {
		this.element.addEventListener(eventType, handlerFn);
	}

	handlers.push(handlerFn);
});

proto.off = Event(function(eventType, handlerFn, handlers) {
	if (eventType in this.element) {
		this.element.removeEventListener(eventType, handlerFn);
	}

	for (var i=0; i<handlers.length; i++) {
		handlers[i] === handlerFn &&
			handlers.splice(i--, 1);
	}
});

proto.emit = Event(function(eventType, data, handlers) {
	handlers.forEach(function(handler) {
		handler.call(this, data);
	}.bind(this));
});

proto.destroy = function() {
	this.setListeners('remove');
	instances.splice(instances.indexOf(this), 1);
}

proto.scroll = function(value) {
	this.element.scrollTop += value;
}

proto.setOptions = function(options) {
	extend(this.options, options);
}

window.Scrolly = function() {
	var instance = new Scrolly(arguments[0], arguments[1]);

	instances.push(instance);
	return instance;
}

extend(window.Scrolly, {
	instances: instances,
	defaults: Scrolly.defaults,
	setDefaults: function(options) {
		extend(this.defaults, options);
	}
});
})();
