﻿//MooTools More, <http://mootools.net/more>. Copyright (c) 2006-2009 Aaron Newton <http://clientcide.com/>, Valerio Proietti <http://mad4milk.net> & the MooTools team <http://mootools.net/developers>, MIT Style License.

/*
---

script: More.js

description: MooTools More

license: MIT-style license

authors:
- Guillermo Rauch
- Thomas Aylott
- Scott Kyle

requires:
- core:1.2.4/MooTools

provides: [MooTools.More]

...
*/

MooTools.More = {
	'version': '1.2.4.4',
	'build': '6f6057dc645fdb7547689183b2311063bd653ddf'
};

/*
---

script: MooTools.Lang.js

description: Provides methods for localization.

license: MIT-style license

authors:
- Aaron Newton

requires:
- core:1.2.4/Events
- /MooTools.More

provides: [MooTools.Lang]

...
*/

(function () {

	var data = {
		language: 'en-US',
		languages: {
			'en-US': {}
		},
		cascades: ['en-US']
	};

	var cascaded;

	MooTools.lang = new Events();

	$extend(MooTools.lang, {

		setLanguage: function (lang) {
			if (!data.languages[lang]) return this;
			data.language = lang;
			this.load();
			this.fireEvent('langChange', lang);
			return this;
		},

		load: function () {
			var langs = this.cascade(this.getCurrentLanguage());
			cascaded = {};
			$each(langs, function (set, setName) {
				cascaded[setName] = this.lambda(set);
			}, this);
		},

		getCurrentLanguage: function () {
			return data.language;
		},

		addLanguage: function (lang) {
			data.languages[lang] = data.languages[lang] || {};
			return this;
		},

		cascade: function (lang) {
			var cascades = (data.languages[lang] || {}).cascades || [];
			cascades.combine(data.cascades);
			cascades.erase(lang).push(lang);
			var langs = cascades.map(function (lng) {
				return data.languages[lng];
			}, this);
			return $merge.apply(this, langs);
		},

		lambda: function (set) {
			(set || {}).get = function (key, args) {
				return $lambda(set[key]).apply(this, $splat(args));
			};
			return set;
		},

		get: function (set, key, args) {
			if (cascaded && cascaded[set]) return (key ? cascaded[set].get(key, args) : cascaded[set]);
		},

		set: function (lang, set, members) {
			this.addLanguage(lang);
			langData = data.languages[lang];
			if (!langData[set]) langData[set] = {};
			$extend(langData[set], members);
			if (lang == this.getCurrentLanguage()) {
				this.load();
				this.fireEvent('langChange', lang);
			}
			return this;
		},

		list: function () {
			return Hash.getKeys(data.languages);
		}

	});

})();

/*
---

script: Class.Refactor.js

description: Extends a class onto itself with new property, preserving any items attached to the class's namespace.

license: MIT-style license

authors:
- Aaron Newton

requires:
- core:1.2.4/Class
- /MooTools.More

provides: [Class.refactor]

...
*/

Class.refactor = function (original, refactors) {

	$each(refactors, function (item, name) {
		var origin = original.prototype[name];
		if (origin && (origin = origin._origin) && typeof item == 'function') original.implement(name, function () {
			var old = this.previous;
			this.previous = origin;
			var value = item.apply(this, arguments);
			this.previous = old;
			return value;
		}); else original.implement(name, item);
	});

	return original;

};

/*
---

script: Chain.Wait.js

description: value, Adds a method to inject pauses between chained events.

license: MIT-style license.

authors:
- Aaron Newton

requires: 
- core:1.2.4/Chain 
- core:1.2.4/Element
- core:1.2.4/Fx
- /MooTools.More

provides: [Chain.Wait]

...
*/

(function () {

	var wait = {
		wait: function (duration) {
			return this.chain(function () {
				this.callChain.delay($pick(duration, 500), this);
			} .bind(this));
		}
	};

	Chain.implement(wait);

	if (window.Fx) {
		Fx.implement(wait);
		['Css', 'Tween', 'Elements'].each(function (cls) {
			if (Fx[cls]) Fx[cls].implement(wait);
		});
	}

	Element.implement({
		chains: function (effects) {
			$splat($pick(effects, ['tween', 'morph', 'reveal'])).each(function (effect) {
				effect = this.get(effect);
				if (!effect) return;
				effect.setOptions({
					link: 'chain'
				});
			}, this);
			return this;
		},
		pauseFx: function (duration, effect) {
			this.chains(effect).get($pick(effect, 'tween')).wait(duration);
			return this;
		}
	});

})();

/*
---

script: Array.Extras.js

description: Extends the Array native object to include useful methods to work with arrays.

license: MIT-style license

authors:
- Christoph Pojer

requires:
- core:1.2.4/Array

provides: [Array.Extras]

...
*/
Array.implement({

	min: function () {
		return Math.min.apply(null, this);
	},

	max: function () {
		return Math.max.apply(null, this);
	},

	average: function () {
		return this.length ? this.sum() / this.length : 0;
	},

	sum: function () {
		var result = 0, l = this.length;
		if (l) {
			do {
				result += this[--l];
			} while (l);
		}
		return result;
	},

	unique: function () {
		return [].combine(this);
	},

	shuffle: function () {
		for (var i = this.length; i && --i; ) {
			var temp = this[i], r = Math.floor(Math.random() * (i + 1));
			this[i] = this[r];
			this[r] = temp;
		}
		return this;
	}

});

/*
---

script: Date.js

description: Extends the Date native object to include methods useful in managing dates.

license: MIT-style license

authors:
- Aaron Newton
- Nicholas Barthelemy - https://svn.nbarthelemy.com/date-js/
- Harald Kirshner - mail [at] digitarald.de; http://digitarald.de
- Scott Kyle - scott [at] appden.com; http://appden.com

requires:
- core:1.2.4/Array
- core:1.2.4/String
- core:1.2.4/Number
- core:1.2.4/Lang
- core:1.2.4/Date.English.US
- /MooTools.More

provides: [Date]

...
*/

(function () {

	var Date = this.Date;

	if (!Date.now) Date.now = $time;

	Date.Methods = {
		ms: 'Milliseconds',
		year: 'FullYear',
		min: 'Minutes',
		mo: 'Month',
		sec: 'Seconds',
		hr: 'Hours'
	};

	['Date', 'Day', 'FullYear', 'Hours', 'Milliseconds', 'Minutes', 'Month', 'Seconds', 'Time', 'TimezoneOffset',
	'Week', 'Timezone', 'GMTOffset', 'DayOfYear', 'LastMonth', 'LastDayOfMonth', 'UTCDate', 'UTCDay', 'UTCFullYear',
	'AMPM', 'Ordinal', 'UTCHours', 'UTCMilliseconds', 'UTCMinutes', 'UTCMonth', 'UTCSeconds'].each(function (method) {
		Date.Methods[method.toLowerCase()] = method;
	});

	var pad = function (what, length) {
		return new Array(length - String(what).length + 1).join('0') + what;
	};

	Date.implement({

		set: function (prop, value) {
			switch ($type(prop)) {
				case 'object':
					for (var p in prop) this.set(p, prop[p]);
					break;
				case 'string':
					prop = prop.toLowerCase();
					var m = Date.Methods;
					if (m[prop]) this['set' + m[prop]](value);
			}
			return this;
		},

		get: function (prop) {
			prop = prop.toLowerCase();
			var m = Date.Methods;
			if (m[prop]) return this['get' + m[prop]]();
			return null;
		},

		clone: function () {
			return new Date(this.get('time'));
		},

		increment: function (interval, times) {
			interval = interval || 'day';
			times = $pick(times, 1);

			switch (interval) {
				case 'year':
					return this.increment('month', times * 12);
				case 'month':
					var d = this.get('date');
					this.set('date', 1).set('mo', this.get('mo') + times);
					return this.set('date', d.min(this.get('lastdayofmonth')));
				case 'week':
					return this.increment('day', times * 7);
				case 'day':
					return this.set('date', this.get('date') + times);
			}

			if (!Date.units[interval]) throw new Error(interval + ' is not a supported interval');

			return this.set('time', this.get('time') + times * Date.units[interval]());
		},

		decrement: function (interval, times) {
			return this.increment(interval, -1 * $pick(times, 1));
		},

		isLeapYear: function () {
			return Date.isLeapYear(this.get('year'));
		},

		clearTime: function () {
			return this.set({ hr: 0, min: 0, sec: 0, ms: 0 });
		},

		diff: function (date, resolution) {
			if ($type(date) == 'string') date = Date.parse(date);

			return ((date - this) / Date.units[resolution || 'day'](3, 3)).toInt(); // non-leap year, 30-day month
		},

		getLastDayOfMonth: function () {
			return Date.daysInMonth(this.get('mo'), this.get('year'));
		},

		getDayOfYear: function () {
			return (Date.UTC(this.get('year'), this.get('mo'), this.get('date') + 1)
			- Date.UTC(this.get('year'), 0, 1)) / Date.units.day();
		},

		getWeek: function () {
			return (this.get('dayofyear') / 7).ceil();
		},

		getOrdinal: function (day) {
			return Date.getMsg('ordinal', day || this.get('date'));
		},

		getTimezone: function () {
			return this.toString()
			.replace(/^.*? ([A-Z]{3}).[0-9]{4}.*$/, '$1')
			.replace(/^.*?\(([A-Z])[a-z]+ ([A-Z])[a-z]+ ([A-Z])[a-z]+\)$/, '$1$2$3');
		},

		getGMTOffset: function () {
			var off = this.get('timezoneOffset');
			return ((off > 0) ? '-' : '+') + pad((off.abs() / 60).floor(), 2) + pad(off % 60, 2);
		},

		setAMPM: function (ampm) {
			ampm = ampm.toUpperCase();
			var hr = this.get('hr');
			if (hr > 11 && ampm == 'AM') return this.decrement('hour', 12);
			else if (hr < 12 && ampm == 'PM') return this.increment('hour', 12);
			return this;
		},

		getAMPM: function () {
			return (this.get('hr') < 12) ? 'AM' : 'PM';
		},

		parse: function (str) {
			this.set('time', Date.parse(str));
			return this;
		},

		isValid: function (date) {
			return !!(date || this).valueOf();
		},

		format: function (f) {
			if (!this.isValid()) return 'invalid date';
			f = f || '%x %X';
			f = formats[f.toLowerCase()] || f; // replace short-hand with actual format
			var d = this;
			return f.replace(/%([a-z%])/gi,
			function ($0, $1) {
				switch ($1) {
					case 'a': return Date.getMsg('days')[d.get('day')].substr(0, 3);
					case 'A': return Date.getMsg('days')[d.get('day')];
					case 'b': return Date.getMsg('months')[d.get('month')].substr(0, 3);
					case 'B': return Date.getMsg('months')[d.get('month')];
					case 'c': return d.toString();
					case 'd': return pad(d.get('date'), 2);
					case 'H': return pad(d.get('hr'), 2);
					case 'I': return ((d.get('hr') % 12) || 12);
					case 'j': return pad(d.get('dayofyear'), 3);
					case 'm': return pad((d.get('mo') + 1), 2);
					case 'M': return pad(d.get('min'), 2);
					case 'o': return d.get('ordinal');
					case 'p': return Date.getMsg(d.get('ampm'));
					case 'S': return pad(d.get('seconds'), 2);
					case 'U': return pad(d.get('week'), 2);
					case 'w': return d.get('day');
					case 'x': return d.format(Date.getMsg('shortDate'));
					case 'X': return d.format(Date.getMsg('shortTime'));
					case 'y': return d.get('year').toString().substr(2);
					case 'Y': return d.get('year');
					case 'T': return d.get('GMTOffset');
					case 'Z': return d.get('Timezone');
				}
				return $1;
			}
		);
		},

		toISOString: function () {
			return this.format('iso8601');
		}

	});

	Date.alias('toISOString', 'toJSON');
	Date.alias('diff', 'compare');
	Date.alias('format', 'strftime');

	var formats = {
		db: '%Y-%m-%d %H:%M:%S',
		compact: '%Y%m%dT%H%M%S',
		iso8601: '%Y-%m-%dT%H:%M:%S%T',
		rfc822: '%a, %d %b %Y %H:%M:%S %Z',
		'short': '%d %b %H:%M',
		'long': '%B %d, %Y %H:%M'
	};

	var parsePatterns = [];
	var nativeParse = Date.parse;

	var parseWord = function (type, word, num) {
		var ret = -1;
		var translated = Date.getMsg(type + 's');

		switch ($type(word)) {
			case 'object':
				ret = translated[word.get(type)];
				break;
			case 'number':
				ret = translated[month - 1];
				if (!ret) throw new Error('Invalid ' + type + ' index: ' + index);
				break;
			case 'string':
				var match = translated.filter(function (name) {
					return this.test(name);
				}, new RegExp('^' + word, 'i'));
				if (!match.length) throw new Error('Invalid ' + type + ' string');
				if (match.length > 1) throw new Error('Ambiguous ' + type);
				ret = match[0];
		}

		return (num) ? translated.indexOf(ret) : ret;
	};

	Date.extend({

		getMsg: function (key, args) {
			return MooTools.lang.get('Date', key, args);
		},

		units: {
			ms: $lambda(1),
			second: $lambda(1000),
			minute: $lambda(60000),
			hour: $lambda(3600000),
			day: $lambda(86400000),
			week: $lambda(608400000),
			month: function (month, year) {
				var d = new Date;
				return Date.daysInMonth($pick(month, d.get('mo')), $pick(year, d.get('year'))) * 86400000;
			},
			year: function (year) {
				year = year || new Date().get('year');
				return Date.isLeapYear(year) ? 31622400000 : 31536000000;
			}
		},

		daysInMonth: function (month, year) {
			return [31, Date.isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month];
		},

		isLeapYear: function (year) {
			return ((year % 4 === 0) && (year % 100 !== 0)) || (year % 400 === 0);
		},

		parse: function (from) {
			var t = $type(from);
			if (t == 'number') return new Date(from);
			if (t != 'string') return from;
			from = from.clean();
			if (!from.length) return null;

			var parsed;
			parsePatterns.some(function (pattern) {
				var bits = pattern.re.exec(from);
				return (bits) ? (parsed = pattern.handler(bits)) : false;
			});

			return parsed || new Date(nativeParse(from));
		},

		parseDay: function (day, num) {
			return parseWord('day', day, num);
		},

		parseMonth: function (month, num) {
			return parseWord('month', month, num);
		},

		parseUTC: function (value) {
			var localDate = new Date(value);
			var utcSeconds = Date.UTC(
			localDate.get('year'),
			localDate.get('mo'),
			localDate.get('date'),
			localDate.get('hr'),
			localDate.get('min'),
			localDate.get('sec')
		);
			return new Date(utcSeconds);
		},

		orderIndex: function (unit) {
			return Date.getMsg('dateOrder').indexOf(unit) + 1;
		},

		defineFormat: function (name, format) {
			formats[name] = format;
		},

		defineFormats: function (formats) {
			for (var name in formats) Date.defineFormat(name, formats[name]);
		},

		parsePatterns: parsePatterns, // this is deprecated

		defineParser: function (pattern) {
			parsePatterns.push((pattern.re && pattern.handler) ? pattern : build(pattern));
		},

		defineParsers: function () {
			Array.flatten(arguments).each(Date.defineParser);
		},

		define2DigitYearStart: function (year) {
			startYear = year % 100;
			startCentury = year - startYear;
		}

	});

	var startCentury = 1900;
	var startYear = 70;

	var regexOf = function (type) {
		return new RegExp('(?:' + Date.getMsg(type).map(function (name) {
			return name.substr(0, 3);
		}).join('|') + ')[a-z]*');
	};

	var replacers = function (key) {
		switch (key) {
			case 'x': // iso8601 covers yyyy-mm-dd, so just check if month is first
				return ((Date.orderIndex('month') == 1) ? '%m[.-/]%d' : '%d[.-/]%m') + '([.-/]%y)?';
			case 'X':
				return '%H([.:]%M)?([.:]%S([.:]%s)?)? ?%p? ?%T?';
		}
		return null;
	};

	var keys = {
		d: /[0-2]?[0-9]|3[01]/,
		H: /[01]?[0-9]|2[0-3]/,
		I: /0?[1-9]|1[0-2]/,
		M: /[0-5]?\d/,
		s: /\d+/,
		o: /[a-z]*/,
		p: /[ap]\.?m\.?/,
		y: /\d{2}|\d{4}/,
		Y: /\d{4}/,
		T: /Z|[+-]\d{2}(?::?\d{2})?/
	};

	keys.m = keys.I;
	keys.S = keys.M;

	var currentLanguage;

	var recompile = function (language) {
		currentLanguage = language;

		keys.a = keys.A = regexOf('days');
		keys.b = keys.B = regexOf('months');

		parsePatterns.each(function (pattern, i) {
			if (pattern.format) parsePatterns[i] = build(pattern.format);
		});
	};

	var build = function (format) {
		if (!currentLanguage) return { format: format };

		var parsed = [];
		var re = (format.source || format) // allow format to be regex
	 .replace(/%([a-z])/gi,
		function ($0, $1) {
			return replacers($1) || $0;
		}
	).replace(/\((?!\?)/g, '(?:') // make all groups non-capturing
	 .replace(/ (?!\?|\*)/g, ',? ') // be forgiving with spaces and commas
	 .replace(/%([a-z%])/gi,
		function ($0, $1) {
			var p = keys[$1];
			if (!p) return $1;
			parsed.push($1);
			return '(' + p.source + ')';
		}
	).replace(/\[a-z\]/gi, '[a-z\\u00c0-\\uffff]'); // handle unicode words

		return {
			format: format,
			re: new RegExp('^' + re + '$', 'i'),
			handler: function (bits) {
				bits = bits.slice(1).associate(parsed);
				var date = new Date().clearTime();
				if ('d' in bits) handle.call(date, 'd', 1);
				if ('m' in bits || 'b' in bits || 'B' in bits) handle.call(date, 'm', 1);
				for (var key in bits) handle.call(date, key, bits[key]);
				return date;
			}
		};
	};

	var handle = function (key, value) {
		if (!value) return this;

		switch (key) {
			case 'a': case 'A': return this.set('day', Date.parseDay(value, true));
			case 'b': case 'B': return this.set('mo', Date.parseMonth(value, true));
			case 'd': return this.set('date', value);
			case 'H': case 'I': return this.set('hr', value);
			case 'm': return this.set('mo', value - 1);
			case 'M': return this.set('min', value);
			case 'p': return this.set('ampm', value.replace(/\./g, ''));
			case 'S': return this.set('sec', value);
			case 's': return this.set('ms', ('0.' + value) * 1000);
			case 'w': return this.set('day', value);
			case 'Y': return this.set('year', value);
			case 'y':
				value = +value;
				if (value < 100) value += startCentury + (value < startYear ? 100 : 0);
				return this.set('year', value);
			case 'T':
				if (value == 'Z') value = '+00';
				var offset = value.match(/([+-])(\d{2}):?(\d{2})?/);
				offset = (offset[1] + '1') * (offset[2] * 60 + (+offset[3] || 0)) + this.getTimezoneOffset();
				return this.set('time', this - offset * 60000);
		}

		return this;
	};

	Date.defineParsers(
	'%Y([-./]%m([-./]%d((T| )%X)?)?)?', // "1999-12-31", "1999-12-31 11:59pm", "1999-12-31 23:59:59", ISO8601
	'%Y%m%d(T%H(%M%S?)?)?', // "19991231", "19991231T1159", compact
	'%x( %X)?', // "12/31", "12.31.99", "12-31-1999", "12/31/2008 11:59 PM"
	'%d%o( %b( %Y)?)?( %X)?', // "31st", "31st December", "31 Dec 1999", "31 Dec 1999 11:59pm"
	'%b( %d%o)?( %Y)?( %X)?', // Same as above with month and day switched
	'%Y %b( %d%o( %X)?)?', // Same as above with year coming first
	'%o %b %d %X %T %Y' // "Thu Oct 22 08:11:23 +0000 2009"
);

	MooTools.lang.addEvent('langChange', function (language) {
		if (MooTools.lang.get('Date')) recompile(language);
	}).fireEvent('langChange', MooTools.lang.getCurrentLanguage());

})();

/*
---

script: Hash.Extras.js

description: Extends the Hash native object to include getFromPath which allows a path notation to child elements.

license: MIT-style license

authors:
- Aaron Newton

requires:
- core:1.2.4/Hash.base
- /MooTools.More

provides: [Hash.Extras]

...
*/

Hash.implement({

	getFromPath: function (notation) {
		var source = this.getClean();
		notation.replace(/\[([^\]]+)\]|\.([^.[]+)|[^[.]+/g, function (match) {
			if (!source) return null;
			var prop = arguments[2] || arguments[1] || arguments[0];
			source = (prop in source) ? source[prop] : null;
			return match;
		});
		return source;
	},

	cleanValues: function (method) {
		method = method || $defined;
		this.each(function (v, k) {
			if (!method(v)) this.erase(k);
		}, this);
		return this;
	},

	run: function () {
		var args = arguments;
		this.each(function (v, k) {
			if ($type(v) == 'function') v.run(args);
		});
	}

});

/*
---

script: String.Extras.js

description: Extends the String native object to include methods useful in managing various kinds of strings (query strings, urls, html, etc).

license: MIT-style license

authors:
- Aaron Newton
- Guillermo Rauch

requires:
- core:1.2.4/String
- core:1.2.4/$util
- core:1.2.4/Array

provides: [String.Extras]

...
*/

(function () {

	var special = ['Ã€', 'Ã ', 'Ã', 'Ã¡', 'Ã‚', 'Ã¢', 'Ãƒ', 'Ã£', 'Ã„', 'Ã¤', 'Ã…', 'Ã¥', 'Ä‚', 'Äƒ', 'Ä„', 'Ä…', 'Ä†', 'Ä‡', 'ÄŒ', 'Ä', 'Ã‡', 'Ã§', 'ÄŽ', 'Ä', 'Ä', 'Ä‘', 'Ãˆ', 'Ã¨', 'Ã‰', 'Ã©', 'ÃŠ', 'Ãª', 'Ã‹', 'Ã«', 'Äš', 'Ä›', 'Ä˜', 'Ä™', 'Äž', 'ÄŸ', 'ÃŒ', 'Ã¬', 'Ã', 'Ã­', 'ÃŽ', 'Ã®', 'Ã', 'Ã¯', 'Ä¹', 'Äº', 'Ä½', 'Ä¾', 'Å', 'Å‚', 'Ã‘', 'Ã±', 'Å‡', 'Åˆ', 'Åƒ', 'Å„', 'Ã’', 'Ã²', 'Ã“', 'Ã³', 'Ã”', 'Ã´', 'Ã•', 'Ãµ', 'Ã–', 'Ã¶', 'Ã˜', 'Ã¸', 'Å‘', 'Å˜', 'Å™', 'Å”', 'Å•', 'Å ', 'Å¡', 'Åž', 'ÅŸ', 'Åš', 'Å›', 'Å¤', 'Å¥', 'Å¤', 'Å¥', 'Å¢', 'Å£', 'Ã™', 'Ã¹', 'Ãš', 'Ãº', 'Ã›', 'Ã»', 'Ãœ', 'Ã¼', 'Å®', 'Å¯', 'Å¸', 'Ã¿', 'Ã½', 'Ã', 'Å½', 'Å¾', 'Å¹', 'Åº', 'Å»', 'Å¼', 'Ãž', 'Ã¾', 'Ã', 'Ã°', 'ÃŸ', 'Å’', 'Å“', 'Ã†', 'Ã¦', 'Âµ'];

	var standard = ['A', 'a', 'A', 'a', 'A', 'a', 'A', 'a', 'Ae', 'ae', 'A', 'a', 'A', 'a', 'A', 'a', 'C', 'c', 'C', 'c', 'C', 'c', 'D', 'd', 'D', 'd', 'E', 'e', 'E', 'e', 'E', 'e', 'E', 'e', 'E', 'e', 'E', 'e', 'G', 'g', 'I', 'i', 'I', 'i', 'I', 'i', 'I', 'i', 'L', 'l', 'L', 'l', 'L', 'l', 'N', 'n', 'N', 'n', 'N', 'n', 'O', 'o', 'O', 'o', 'O', 'o', 'O', 'o', 'Oe', 'oe', 'O', 'o', 'o', 'R', 'r', 'R', 'r', 'S', 's', 'S', 's', 'S', 's', 'T', 't', 'T', 't', 'T', 't', 'U', 'u', 'U', 'u', 'U', 'u', 'Ue', 'ue', 'U', 'u', 'Y', 'y', 'Y', 'y', 'Z', 'z', 'Z', 'z', 'Z', 'z', 'TH', 'th', 'DH', 'dh', 'ss', 'OE', 'oe', 'AE', 'ae', 'u'];

	var tidymap = {
		"[\xa0\u2002\u2003\u2009]": " ",
		"\xb7": "*",
		"[\u2018\u2019]": "'",
		"[\u201c\u201d]": '"',
		"\u2026": "...",
		"\u2013": "-",
		"\u2014": "--",
		"\uFFFD": "&raquo;"
	};

	var getRegForTag = function (tag, contents) {
		tag = tag || '';
		var regstr = contents ? "<" + tag + "[^>]*>([\\s\\S]*?)<\/" + tag + ">" : "<\/?" + tag + "([^>]+)?>";
		reg = new RegExp(regstr, "gi");
		return reg;
	};

	String.implement({

		standardize: function () {
			var text = this;
			special.each(function (ch, i) {
				text = text.replace(new RegExp(ch, 'g'), standard[i]);
			});
			return text;
		},

		repeat: function (times) {
			return new Array(times + 1).join(this);
		},

		pad: function (length, str, dir) {
			if (this.length >= length) return this;
			var pad = (str == null ? ' ' : '' + str).repeat(length - this.length).substr(0, length - this.length);
			if (!dir || dir == 'right') return this + pad;
			if (dir == 'left') return pad + this;
			return pad.substr(0, (pad.length / 2).floor()) + this + pad.substr(0, (pad.length / 2).ceil());
		},

		getTags: function (tag, contents) {
			return this.match(getRegForTag(tag, contents)) || [];
		},

		stripTags: function (tag, contents) {
			return this.replace(getRegForTag(tag, contents), '');
		},

		tidy: function () {
			var txt = this.toString();
			$each(tidymap, function (value, key) {
				txt = txt.replace(new RegExp(key, 'g'), value);
			});
			return txt;
		}

	});

})();

/*
---

script: String.QueryString.js

description: Methods for dealing with URI query strings.

license: MIT-style license

authors:
- Sebastian MarkbÃ¥ge, Aaron Newton, Lennart Pilon, Valerio Proietti

requires:
- core:1.2.4/Array
- core:1.2.4/String
- /MooTools.More

provides: [String.QueryString]

...
*/

String.implement({

	parseQueryString: function () {
		var vars = this.split(/[&;]/), res = {};
		if (vars.length) vars.each(function (val) {
			var index = val.indexOf('='),
				keys = index < 0 ? [''] : val.substr(0, index).match(/[^\]\[]+/g),
				value = decodeURIComponent(val.substr(index + 1)),
				obj = res;
			keys.each(function (key, i) {
				var current = obj[key];
				if (i < keys.length - 1)
					obj = obj[key] = current || {};
				else if ($type(current) == 'array')
					current.push(value);
				else
					obj[key] = $defined(current) ? [current, value] : value;
			});
		});
		return res;
	},

	cleanQueryString: function (method) {
		return this.split('&').filter(function (val) {
			var index = val.indexOf('='),
			key = index < 0 ? '' : val.substr(0, index),
			value = val.substr(index + 1);
			return method ? method.run([key, value]) : $chk(value);
		}).join('&');
	}

});

/*
---

script: URI.js

description: Provides methods useful in managing the window location and uris.

license: MIT-style license

authors:
- Sebastian Markbåge
- Aaron Newton

requires:
- core:1.2.4/Selectors
- /String.QueryString

provides: URI

...
*/

var URI = new Class({

	Implements: Options,

	options: {
	/*base: false*/
},

regex: /^(?:(\w+):)?(?:\/\/(?:(?:([^:@\/]*):?([^:@\/]*))?@)?([^:\/?#]*)(?::(\d*))?)?(\.\.?$|(?:[^?#\/]*\/)*)([^?#]*)(?:\?([^#]*))?(?:#(.*))?/,
parts: ['scheme', 'user', 'password', 'host', 'port', 'directory', 'file', 'query', 'fragment'],
schemes: { http: 80, https: 443, ftp: 21, rtsp: 554, mms: 1755, file: 0 },

initialize: function (uri, options) {
	this.setOptions(options);
	var base = this.options.base || URI.base;
	if (!uri) uri = base;

	if (uri && uri.parsed) this.parsed = $unlink(uri.parsed);
	else this.set('value', uri.href || uri.toString(), base ? new URI(base) : false);
},

parse: function (value, base) {
	var bits = value.match(this.regex);
	if (!bits) return false;
	bits.shift();
	return this.merge(bits.associate(this.parts), base);
},

merge: function (bits, base) {
	if ((!bits || !bits.scheme) && (!base || !base.scheme)) return false;
	if (base) {
		this.parts.every(function (part) {
			if (bits[part]) return false;
			bits[part] = base[part] || '';
			return true;
		});
	}
	bits.port = bits.port || this.schemes[bits.scheme.toLowerCase()];
	bits.directory = bits.directory ? this.parseDirectory(bits.directory, base ? base.directory : '') : '/';
	return bits;
},

parseDirectory: function (directory, baseDirectory) {
	directory = (directory.substr(0, 1) == '/' ? '' : (baseDirectory || '/')) + directory;
	if (!directory.test(URI.regs.directoryDot)) return directory;
	var result = [];
	directory.replace(URI.regs.endSlash, '').split('/').each(function (dir) {
		if (dir == '..' && result.length > 0) result.pop();
		else if (dir != '.') result.push(dir);
	});
	return result.join('/') + '/';
},

combine: function (bits) {
	return bits.value || bits.scheme + '://' +
			(bits.user ? bits.user + (bits.password ? ':' + bits.password : '') + '@' : '') +
			(bits.host || '') + (bits.port && bits.port != this.schemes[bits.scheme] ? ':' + bits.port : '') +
			(bits.directory || '/') + (bits.file || '') +
			(bits.query ? '?' + bits.query : '') +
			(bits.fragment ? '#' + bits.fragment : '');
},

set: function (part, value, base) {
	if (part == 'value') {
		var scheme = value.match(URI.regs.scheme);
		if (scheme) scheme = scheme[1];
		if (scheme && !$defined(this.schemes[scheme.toLowerCase()])) this.parsed = { scheme: scheme, value: value };
		else this.parsed = this.parse(value, (base || this).parsed) || (scheme ? { scheme: scheme, value: value} : { value: value });
	} else if (part == 'data') {
		this.setData(value);
	} else {
		this.parsed[part] = value;
	}
	return this;
},

get: function (part, base) {
	switch (part) {
		case 'value': return this.combine(this.parsed, base ? base.parsed : false);
		case 'data': return this.getData();
	}
	return this.parsed[part] || '';
},

go: function () {
	document.location.href = this.toString();
},

toURI: function () {
	return this;
},

getData: function (key, part) {
	var qs = this.get(part || 'query');
	if (!$chk(qs)) return key ? null : {};
	var obj = qs.parseQueryString();
	return key ? obj[key] : obj;
},

setData: function (values, merge, part) {
	if (typeof values == 'string') {
		data = this.getData();
		data[arguments[0]] = arguments[1];
		values = data;
	} else if (merge) {
		values = $merge(this.getData(), values);
	}
	return this.set(part || 'query', Hash.toQueryString(values));
},

clearData: function (part) {
	return this.set(part || 'query', '');
}


});


URI.prototype.toString = URI.prototype.valueOf = function () {

	return this.get('value');

};


URI.regs = {

	endSlash: /\/$/,

	scheme: /^(\w+):/,

	directoryDot: /\.\/|\.$/

};


URI.base = new URI(document.getElements('base[href]', true).getLast(), { base: document.location });


String.implement({


	toURI: function (options) {

		return new URI(this, options);

	}


});


/*

---


script: URI.Relative.js


description: Extends the URI class to add methods for computing relative and absolute urls.


license: MIT-style license


authors:

- Sebastian MarkbÃ¥ge



requires:

- /Class.refactor

- /URI


provides: [URI.Relative]


...

*/


URI = Class.refactor(URI, {


	combine: function (bits, base) {

		if (!base || bits.scheme != base.scheme || bits.host != base.host || bits.port != base.port)

			return this.previous.apply(this, arguments);

		var end = bits.file + (bits.query ? '?' + bits.query : '') + (bits.fragment ? '#' + bits.fragment : '');


		if (!base.directory) return (bits.directory || (bits.file ? '' : './')) + end;


		var baseDir = base.directory.split('/'),
			relDir = bits.directory.split('/'),
			path = '',
			offset;


		var i = 0;

		for (offset = 0; offset < baseDir.length && offset < relDir.length && baseDir[offset] == relDir[offset]; offset++);

		for (i = 0; i < baseDir.length - offset - 1; i++) path += '../';

		for (i = offset; i < relDir.length - 1; i++) path += relDir[i] + '/';


		return (path || (bits.file ? '' : './')) + end;

	},


	toAbsolute: function (base) {

		base = new URI(base);

		if (base) base.set('directory', '').set('file', '');

		return this.toRelative(base);

	},


	toRelative: function (base) {

		return this.get('value', new URI(base));

	}


});


/*

---


script: Element.Forms.js


description: Extends the Element native object to include methods useful in managing inputs.


license: MIT-style license


authors:

- Aaron Newton


requires:

- core:1.2.4/Element

- /MooTools.More


provides: [Element.Forms]


...

*/


Element.implement({


	tidy: function () {

		this.set('value', this.get('value').tidy());

	},


	getTextInRange: function (start, end) {

		return this.get('value').substring(start, end);

	},


	getSelectedText: function () {

		if (this.setSelectionRange) return this.getTextInRange(this.getSelectionStart(), this.getSelectionEnd());

		return document.selection.createRange().text;

	},


	getSelectedRange: function () {

		if ($defined(this.selectionStart)) return { start: this.selectionStart, end: this.selectionEnd };

		var pos = { start: 0, end: 0 };

		var range = this.getDocument().selection.createRange();

		if (!range || range.parentElement() != this) return pos;

		var dup = range.duplicate();

		if (this.type == 'text') {

			pos.start = 0 - dup.moveStart('character', -100000);

			pos.end = pos.start + range.text.length;

		} else {

			var value = this.get('value');

			var offset = value.length;

			dup.moveToElementText(this);

			dup.setEndPoint('StartToEnd', range);

			if (dup.text.length) offset -= value.match(/[\n\r]*$/)[0].length;

			pos.end = offset - dup.text.length;

			dup.setEndPoint('StartToStart', range);

			pos.start = offset - dup.text.length;

		}

		return pos;

	},


	getSelectionStart: function () {

		return this.getSelectedRange().start;

	},


	getSelectionEnd: function () {

		return this.getSelectedRange().end;

	},


	setCaretPosition: function (pos) {

		if (pos == 'end') pos = this.get('value').length;

		this.selectRange(pos, pos);

		return this;

	},


	getCaretPosition: function () {

		return this.getSelectedRange().start;

	},


	selectRange: function (start, end) {

		if (this.setSelectionRange) {

			this.focus();

			this.setSelectionRange(start, end);

		} else {

			var value = this.get('value');

			var diff = value.substr(start, end - start).replace(/\r/g, '').length;

			start = value.substr(0, start).replace(/\r/g, '').length;

			var range = this.createTextRange();

			range.collapse(true);

			range.moveEnd('character', start + diff);

			range.moveStart('character', start);

			range.select();

		}

		return this;

	},


	insertAtCursor: function (value, select) {

		var pos = this.getSelectedRange();

		var text = this.get('value');

		this.set('value', text.substring(0, pos.start) + value + text.substring(pos.end, text.length));

		if ($pick(select, true)) this.selectRange(pos.start, pos.start + value.length);

		else this.setCaretPosition(pos.start + value.length);

		return this;

	},


	insertAroundCursor: function (options, select) {

		options = $extend({

			before: '',

			defaultMiddle: '',

			after: ''

		}, options);

		var value = this.getSelectedText() || options.defaultMiddle;

		var pos = this.getSelectedRange();

		var text = this.get('value');

		if (pos.start == pos.end) {

			this.set('value', text.substring(0, pos.start) + options.before + value + options.after + text.substring(pos.end, text.length));

			this.selectRange(pos.start + options.before.length, pos.end + options.before.length + value.length);

		} else {

			var current = text.substring(pos.start, pos.end);

			this.set('value', text.substring(0, pos.start) + options.before + current + options.after + text.substring(pos.end, text.length));

			var selStart = pos.start + options.before.length;

			if ($pick(select, true)) this.selectRange(selStart, selStart + current.length);

			else this.setCaretPosition(selStart + text.length);

		}

		return this;

	}


});


/*

---


script: Fx.Scroll.js


description: Effect to smoothly scroll any element, including the window.


license: MIT-style license


authors:

- Valerio Proietti


requires:

- core:1.2.4/Fx

- core:1.2.4/Element.Event

- core:1.2.4/Element.Dimensions

- /MooTools.More


provides: [Fx.Scroll]


...

*/


Fx.Scroll = new Class({


	Extends: Fx,


	options: {

		offset: { x: 0, y: 0 },

		wheelStops: true

	},


	initialize: function (element, options) {

		this.element = this.subject = document.id(element);

		this.parent(options);

		var cancel = this.cancel.bind(this, false);


		if ($type(this.element) != 'element') this.element = document.id(this.element.getDocument().body);


		var stopper = this.element;


		if (this.options.wheelStops) {

			this.addEvent('start', function () {

				stopper.addEvent('mousewheel', cancel);

			}, true);

			this.addEvent('complete', function () {

				stopper.removeEvent('mousewheel', cancel);

			}, true);

		}

	},


	set: function () {

		var now = Array.flatten(arguments);

		if (Browser.Engine.gecko) now = [Math.round(now[0]), Math.round(now[1])];

		this.element.scrollTo(now[0], now[1]);

	},


	compute: function (from, to, delta) {

		return [0, 1].map(function (i) {

			return Fx.compute(from[i], to[i], delta);

		});

	},


	start: function (x, y) {

		if (!this.check(x, y)) return this;

		var scrollSize = this.element.getScrollSize(),
			scroll = this.element.getScroll(),
			values = { x: x, y: y };

		for (var z in values) {

			var max = scrollSize[z];

			if ($chk(values[z])) values[z] = ($type(values[z]) == 'number') ? values[z] : max;

			else values[z] = scroll[z];

			values[z] += this.options.offset[z];

		}

		return this.parent([scroll.x, scroll.y], [values.x, values.y]);

	},


	toTop: function () {

		return this.start(false, 0);

	},


	toLeft: function () {

		return this.start(0, false);

	},


	toRight: function () {

		return this.start('right', false);

	},


	toBottom: function () {

		return this.start(false, 'bottom');

	},


	toElement: function (el) {

		var position = document.id(el).getPosition(this.element);

		return this.start(position.x, position.y);

	},


	scrollIntoView: function (el, axes, offset) {

		axes = axes ? $splat(axes) : ['x', 'y'];

		var to = {};

		el = document.id(el);

		var pos = el.getPosition(this.element);

		var size = el.getSize();

		var scroll = this.element.getScroll();

		var containerSize = this.element.getSize();

		var edge = {

			x: pos.x + size.x,

			y: pos.y + size.y

		};

		['x', 'y'].each(function (axis) {

			if (axes.contains(axis)) {

				if (edge[axis] > scroll[axis] + containerSize[axis]) to[axis] = edge[axis] - containerSize[axis];

				if (pos[axis] < scroll[axis]) to[axis] = pos[axis];

			}

			if (to[axis] == null) to[axis] = scroll[axis];

			if (offset && offset[axis]) to[axis] = to[axis] + offset[axis];

		}, this);

		if (to.x != scroll.x || to.y != scroll.y) this.start(to.x, to.y);

		return this;

	},


	scrollToCenter: function (el, axes, offset) {

		axes = axes ? $splat(axes) : ['x', 'y'];

		el = $(el);

		var to = {},
			pos = el.getPosition(this.element),
			size = el.getSize(),
			scroll = this.element.getScroll(),
			containerSize = this.element.getSize(),
			edge = {
				x: pos.x + size.x,
				y: pos.y + size.y
			};


		['x', 'y'].each(function (axis) {

			if (axes.contains(axis)) {

				to[axis] = pos[axis] - (containerSize[axis] - size[axis]) / 2;

			}

			if (to[axis] == null) to[axis] = scroll[axis];

			if (offset && offset[axis]) to[axis] = to[axis] + offset[axis];

		}, this);

		if (to.x != scroll.x || to.y != scroll.y) this.start(to.x, to.y);

		return this;

	}


});



/*

---


script: Fx.Slide.js


description: Effect to slide an element in and out of view.


license: MIT-style license


authors:

- Valerio Proietti


requires:

- core:1.2.4/Fx Element.Style

- /MooTools.More


provides: [Fx.Slide]


...

*/


Fx.Slide = new Class({


	Extends: Fx,


	options: {

		mode: 'vertical',

		wrapper: false,

		hideOverflow: true

	},


	initialize: function (element, options) {

		this.addEvent('complete', function () {

			this.open = (this.wrapper['offset' + this.layout.capitalize()] != 0);

			if (this.open) this.wrapper.setStyle('height', '');

			if (this.open && Browser.Engine.webkit419) this.element.dispose().inject(this.wrapper);

		}, true);

		this.element = this.subject = document.id(element);

		this.parent(options);

		var wrapper = this.element.retrieve('wrapper');

		var styles = this.element.getStyles('margin', 'position', 'overflow');

		if (this.options.hideOverflow) styles = $extend(styles, { overflow: 'hidden' });

		if (this.options.wrapper) wrapper = document.id(this.options.wrapper).setStyles(styles);

		this.wrapper = wrapper || new Element('div', {

			styles: styles

		}).wraps(this.element);

		this.element.store('wrapper', this.wrapper).setStyle('margin', 0);

		this.now = [];

		this.open = true;

	},


	vertical: function () {

		this.margin = 'margin-top';

		this.layout = 'height';

		this.offset = this.element.offsetHeight;

	},


	horizontal: function () {

		this.margin = 'margin-left';

		this.layout = 'width';

		this.offset = this.element.offsetWidth;

	},


	set: function (now) {

		this.element.setStyle(this.margin, now[0]);

		this.wrapper.setStyle(this.layout, now[1]);

		return this;

	},


	compute: function (from, to, delta) {

		return [0, 1].map(function (i) {

			return Fx.compute(from[i], to[i], delta);

		});

	},


	start: function (how, mode) {

		if (!this.check(how, mode)) return this;

		this[mode || this.options.mode]();

		var margin = this.element.getStyle(this.margin).toInt();

		var layout = this.wrapper.getStyle(this.layout).toInt();

		var caseIn = [[margin, layout], [0, this.offset]];

		var caseOut = [[margin, layout], [-this.offset, 0]];

		var start;

		switch (how) {

			case 'in': start = caseIn; break;

			case 'out': start = caseOut; break;

			case 'toggle': start = (layout == 0) ? caseIn : caseOut;

		}

		return this.parent(start[0], start[1]);

	},


	slideIn: function (mode) {

		return this.start('in', mode);

	},


	slideOut: function (mode) {

		return this.start('out', mode);

	},


	hide: function (mode) {

		this[mode || this.options.mode]();

		this.open = false;

		return this.set([-this.offset, 0]);

	},


	show: function (mode) {

		this[mode || this.options.mode]();

		this.open = true;

		return this.set([0, this.offset]);

	},


	toggle: function (mode) {

		return this.start('toggle', mode);

	}


});


Element.Properties.slide = {


	set: function (options) {

		var slide = this.retrieve('slide');

		if (slide) slide.cancel();

		return this.eliminate('slide').store('slide:options', $extend({ link: 'cancel' }, options));

	},


	get: function (options) {

		if (options || !this.retrieve('slide')) {

			if (options || !this.retrieve('slide:options')) this.set('slide', options);

			this.store('slide', new Fx.Slide(this, this.retrieve('slide:options')));

		}

		return this.retrieve('slide');

	}


};


Element.implement({


	slide: function (how, mode) {

		how = how || 'toggle';

		var slide = this.get('slide'), toggle;

		switch (how) {

			case 'hide': slide.hide(mode); break;

			case 'show': slide.show(mode); break;

			case 'toggle':

				var flag = this.retrieve('slide:flag', slide.open);

				slide[flag ? 'slideOut' : 'slideIn'](mode);

				this.store('slide:flag', !flag);

				toggle = true;

				break;

			default: slide.start(how, mode);

		}

		if (!toggle) this.eliminate('slide:flag');

		return this;

	}


});



/*

---


script: Assets.js


description: Provides methods to dynamically load JavaScript, CSS, and Image files into the document.


license: MIT-style license


authors:

- Valerio Proietti


requires:

- core:1.2.4/Element.Event

- /MooTools.More


provides: [Assets]


...

*/


var Asset = {


	javascript: function (source, properties) {

		properties = $extend({

			onload: $empty,

			document: document,

			check: $lambda(true)

		}, properties);


		if (properties.onLoad) properties.onload = properties.onLoad;


		var script = new Element('script', { src: source, type: 'text/javascript' });


		var load = properties.onload.bind(script),
			check = properties.check,
			doc = properties.document;

		delete properties.onload;

		delete properties.check;

		delete properties.document;


		script.addEvents({

			load: load,

			readystatechange: function () {

				if (['loaded', 'complete'].contains(this.readyState)) load();

			}

		}).set(properties);


		if (Browser.Engine.webkit419) var checker = (function () {

			if (!$try(check)) return;

			$clear(checker);

			load();

		}).periodical(50);


		return script.inject(doc.head);

	},


	css: function (source, properties) {

		return new Element('link', $merge({

			rel: 'stylesheet',

			media: 'screen',

			type: 'text/css',

			href: source

		}, properties)).inject(document.head);

	},


	image: function (source, properties) {

		properties = $merge({

			onload: $empty,

			onabort: $empty,

			onerror: $empty

		}, properties);

		var image = new Image();

		var element = document.id(image) || new Element('img');

		['load', 'abort', 'error'].each(function (name) {

			var type = 'on' + name;

			var cap = name.capitalize();

			if (properties['on' + cap]) properties[type] = properties['on' + cap];

			var event = properties[type];

			delete properties[type];

			image[type] = function () {

				if (!image) return;

				if (!element.parentNode) {

					element.width = image.width;

					element.height = image.height;

				}

				image = image.onload = image.onabort = image.onerror = null;

				event.delay(1, element, element);

				element.fireEvent(name, element, 1);

			};

		});

		image.src = element.src = source;

		if (image && image.complete) image.onload.delay(1);

		return element.set(properties);

	},


	images: function (sources, options) {

		options = $merge({

			onComplete: $empty,

			onProgress: $empty,

			onError: $empty,

			properties: {}

		}, options);

		sources = $splat(sources);

		var images = [];

		var counter = 0;

		return new Elements(sources.map(function (source) {

			return Asset.image(source, $extend(options.properties, {

				onload: function () {

					options.onProgress.call(this, counter, sources.indexOf(source));

					counter++;

					if (counter == sources.length) options.onComplete();

				},

				onerror: function () {

					options.onError.call(this, counter, sources.indexOf(source));

					counter++;

					if (counter == sources.length) options.onComplete();

				}

			}));

		}));

	}


};


/*

---


script: Hash.Cookie.js


description: Class for creating, reading, and deleting Cookies in JSON format.


license: MIT-style license


authors:

- Valerio Proietti

- Aaron Newton


requires:

- core:1.2.4/Cookie

- core:1.2.4/JSON

- /MooTools.More


provides: [Hash.Cookie]


...

*/


Hash.Cookie = new Class({


	Extends: Cookie,


	options: {

		autoSave: true

	},


	initialize: function (name, options) {

		this.parent(name, options);

		this.load();

	},


	save: function () {

		var value = JSON.encode(this.hash);

		if (!value || value.length > 4096) return false; //cookie would be truncated!

		if (value == '{}') this.dispose();

		else this.write(value);

		return true;

	},


	load: function () {

		this.hash = new Hash(JSON.decode(this.read(), true));

		return this;

	}


});


Hash.each(Hash.prototype, function (method, name) {

	if (typeof method == 'function') Hash.Cookie.implement(name, function () {

		var value = method.apply(this.hash, arguments);

		if (this.options.autoSave) this.save();

		return value;

	});

});


/*

---


script: Date.English.US.js


description: Date messages for US English.


license: MIT-style license


authors:

- Aaron Newton


requires:

- /Lang

- /Date


provides: [Date.English.US]


...

*/


MooTools.lang.set('en-US', 'Date', {


	months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],

	days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],

	//culture's date order: MM/DD/YYYY

	dateOrder: ['month', 'date', 'year'],

	shortDate: '%m/%d/%Y',

	shortTime: '%I:%M%p',

	AM: 'AM',

	PM: 'PM',


	/* Date.Extras */

	ordinal: function (dayOfMonth) {

		//1st, 2nd, 3rd, etc.

		return (dayOfMonth > 3 && dayOfMonth < 21) ? 'th' : ['th', 'st', 'nd', 'rd', 'th'][Math.min(dayOfMonth % 10, 4)];

	},


	lessThanMinuteAgo: 'less than a minute ago',

	minuteAgo: 'about a minute ago',

	minutesAgo: '{delta} minutes ago',

	hourAgo: 'about an hour ago',

	hoursAgo: 'about {delta} hours ago',

	dayAgo: '1 day ago',

	daysAgo: '{delta} days ago',

	weekAgo: '1 week ago',

	weeksAgo: '{delta} weeks ago',

	monthAgo: '1 month ago',

	monthsAgo: '{delta} months ago',

	yearAgo: '1 year ago',

	yearsAgo: '{delta} years ago',

	lessThanMinuteUntil: 'less than a minute from now',

	minuteUntil: 'about a minute from now',

	minutesUntil: '{delta} minutes from now',

	hourUntil: 'about an hour from now',

	hoursUntil: 'about {delta} hours from now',

	dayUntil: '1 day from now',

	daysUntil: '{delta} days from now',

	weekUntil: '1 week from now',

	weeksUntil: '{delta} weeks from now',

	monthUntil: '1 month from now',

	monthsUntil: '{delta} months from now',

	yearUntil: '1 year from now',

	yearsUntil: '{delta} years from now'


});
