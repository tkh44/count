var SUFFIXES = ['', 'K', 'M', 'B', 'T'],
	MODES = { trunc: 1, floor: 1, ceil: 1, nearest: 1 },
	RGX = /^(-?(?:\d+)?\.?\d+) *(?:(k|thousand)|(m|million)|(b|bn|billion)|(t|tn|trillion))?$/,
	CACHE = {};

export function parse(val) {
	var arr = String(val).replace(/,/g, '').trim().toLowerCase().match(RGX);
	if (arr == null) return;
	// Shift via the exponent so decimal inputs like "1.15k" stay exact.
	var exp = arr[2] ? 3 : arr[3] ? 6 : arr[4] ? 9 : arr[5] ? 12 : 0;
	return Number(arr[1] + 'e' + exp);
}

export function count(strings) {
	var str = '', i = 0, args = arguments;
	for (; i < strings.length; i++) {
		str += strings[i];
		if (i < args.length - 1) str += args[i + 1];
	}
	return parse(str);
}

function resolve(base, opts) {
	var out = {
		decimals: base.decimals,
		rounding: base.rounding,
		maxUnit: base.maxUnit,
		locale: base.locale
	};
	if (opts) {
		if (opts.decimals !== undefined) out.decimals = opts.decimals;
		if (opts.rounding !== undefined) out.rounding = opts.rounding;
		if (opts.maxUnit !== undefined) out.maxUnit = opts.maxUnit;
		if (opts.locale !== undefined) out.locale = opts.locale;
	}
	var d = out.decimals;
	if (d !== (d | 0) || d < 0 || d > 20) {
		throw new RangeError('decimals must be an integer from 0 to 20, got ' + d);
	}
	if (!MODES[out.rounding]) {
		throw new RangeError('rounding must be "trunc", "floor", "ceil", or "nearest", got ' + out.rounding);
	}
	out.max = SUFFIXES.indexOf(out.maxUnit);
	if (out.max < 1) {
		throw new RangeError('maxUnit must be "K", "M", "B", or "T", got ' + out.maxUnit);
	}
	return out;
}

function formatter(locale, d) {
	var key = locale + '|' + d;
	return CACHE[key] || (CACHE[key] = new Intl.NumberFormat(locale, {
		minimumFractionDigits: 0,
		maximumFractionDigits: d
	}));
}

// Returns `value / 1000^idx` scaled by 10^d and rounded to an integer.
// Dividing (or multiplying) by a single power of ten keeps integer inputs exact.
function scale(value, idx, d, mode) {
	var shift = 3 * idx - d,
		x = shift > 0 ? value / Math.pow(10, shift) : value * Math.pow(10, -shift);
	if (mode === 'floor') x = Math.floor(x);
	else if (mode === 'ceil') x = Math.ceil(x);
	else if (mode === 'nearest') x = x < 0 ? -Math.floor(-x + 0.5) : Math.floor(x + 0.5);
	else x = Math.trunc(x);
	return x === 0 ? 0 : x; // drop -0
}

function run(value, o) {
	if (!isFinite(value)) return String(value);
	var d = o.decimals, abs = Math.abs(value), idx = 0, q;
	while (idx < o.max && abs >= Math.pow(1000, idx + 1)) idx++;
	q = scale(value, idx, d, o.rounding);
	// Rounding up can reach the next unit: 999,999 -> "1M", not "1,000K".
	while (idx < o.max && Math.abs(q) >= 1000 * Math.pow(10, d)) {
		q = scale(value, ++idx, d, o.rounding);
	}
	return formatter(o.locale, d).format(q / Math.pow(10, d)) + SUFFIXES[idx];
}

export function createShorten(defaults) {
	var base = resolve({ decimals: 0, rounding: 'trunc', maxUnit: 'T', locale: 'en-US' }, defaults);
	return function shorten(value, overrides) {
		return run(value, overrides ? resolve(base, overrides) : base);
	};
}

export var shorten = createShorten();
