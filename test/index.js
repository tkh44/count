const { test } = require('uvu');
const assert = require('uvu/assert');
const { shorten, createShorten, parse, count } = require('../dist/index.js');

function is(input, opts, expect) {
	assert.is(shorten(input, opts), expect, `shorten(${input}, ${JSON.stringify(opts)}) ~> "${expect}"`);
}

const TOKENS = 12669477740;

test('esm build exposes the same API', async () => {
	const esm = await import('../dist/index.mjs');
	assert.is(esm.shorten(TOKENS), '12B');
	assert.is(esm.count`12B`, 12e9);
});

test('shorten() :: picks the largest unit and truncates by default', () => {
	is(0, undefined, '0');
	is(999, undefined, '999');
	is(999.999, undefined, '999');
	is(1000, undefined, '1K');
	is(74853, undefined, '74K');
	is(60108.993, undefined, '60K');
	is(TOKENS, undefined, '12B');
	is(1e12, undefined, '1T');
	is(1.5e15, undefined, '1,500T');
});

test('shorten() :: decimals is a maximum, trailing zeros dropped', () => {
	is(TOKENS, { decimals: 2 }, '12.66B');
	is(12.4e9, { decimals: 2 }, '12.4B');
	is(12e9, { decimals: 2 }, '12B');
	is(1150, { decimals: 2 }, '1.15K'); // naive float math gives 1.14K
	is(999.999, { decimals: 2 }, '999.99');
});

test('shorten() :: rounding modes', () => {
	is(TOKENS, { rounding: 'trunc' }, '12B');
	is(TOKENS, { rounding: 'floor' }, '12B');
	is(TOKENS, { rounding: 'ceil' }, '13B');
	is(TOKENS, { rounding: 'nearest' }, '13B');
	is(-TOKENS, { rounding: 'trunc' }, '-12B');
	is(-TOKENS, { rounding: 'floor' }, '-13B');
	is(-TOKENS, { rounding: 'ceil' }, '-12B');
	is(-TOKENS, { rounding: 'nearest' }, '-13B');
	is(TOKENS, { decimals: 2, rounding: 'nearest' }, '12.67B');
	is(1500, { rounding: 'nearest' }, '2K');
	is(-1500, { rounding: 'nearest' }, '-2K');
	is(1499, { rounding: 'nearest' }, '1K');
	is(-0.4, undefined, '0');
});

test('shorten() :: rounding up promotes to the next unit', () => {
	is(999999, { rounding: 'nearest' }, '1M');
	is(999999, { rounding: 'ceil' }, '1M');
	is(999999, undefined, '999K');
	is(999.6, { rounding: 'nearest' }, '1K');
	is(999999999, { rounding: 'nearest', maxUnit: 'M' }, '1,000M');
});

test('shorten() :: maxUnit caps the suffix', () => {
	is(TOKENS, { maxUnit: 'M' }, '12,669M');
	is(TOKENS, { maxUnit: 'M', decimals: 2 }, '12,669.47M');
	is(TOKENS, { maxUnit: 'K' }, '12,669,477K');
	is(74853, { maxUnit: 'M', decimals: 2 }, '74.85K');
});

test('shorten() :: locale and non-finite values', () => {
	is(TOKENS, { maxUnit: 'M', decimals: 2, locale: 'de-DE' }, '12.669,47M');
	is(NaN, undefined, 'NaN');
	is(Infinity, undefined, 'Infinity');
});

test('shorten() :: rejects invalid options', () => {
	assert.throws(() => shorten(1, { decimals: 1.5 }), RangeError);
	assert.throws(() => shorten(1, { decimals: -1 }), RangeError);
	assert.throws(() => shorten(1, { rounding: 'up' }), RangeError);
	assert.throws(() => shorten(1, { maxUnit: 'G' }), RangeError);
	assert.throws(() => createShorten({ maxUnit: '' }), RangeError);
});

test('createShorten() :: defaults apply and per-call overrides win', () => {
	const opts = { decimals: 2 };
	const fmt = createShorten(opts);
	opts.decimals = 0; // later mutation must not leak in
	assert.is(fmt(TOKENS), '12.66B');
	assert.is(fmt(TOKENS, { decimals: 0 }), '12B');
	assert.is(fmt(TOKENS, { maxUnit: 'M' }), '12,669.47M');
	assert.is(fmt(TOKENS), '12.66B');
});

test('parse()', () => {
	assert.is(parse('0'), 0);
	assert.is(parse('100'), 100);
	assert.is(parse('1k'), 1000);
	assert.is(parse('1.15K'), 1150);
	assert.is(parse('.5m'), 500000);
	assert.is(parse('12B'), 12e9);
	assert.is(parse('12 bn'), 12e9);
	assert.is(parse('2t'), 2e12);
	assert.is(parse('-1.5k'), -1500);
	assert.is(parse('12,669M'), 12669e6);
	assert.is(parse('3 million'), 3e6);
	assert.is(parse('1 billion'), 1e9);
	assert.is(parse('☃'), undefined);
	assert.is(parse('10-.5'), undefined);
	assert.is(parse('5x'), undefined);
});

test('parse() :: round-trips shorten() output', () => {
	assert.is(parse(shorten(TOKENS, { decimals: 2 })), 12.66e9);
	assert.is(parse(shorten(TOKENS, { maxUnit: 'M' })), 12669e6);
});

test('count`` :: tagged template', () => {
	assert.is(count`12B`, 12e9);
	assert.is(count`${1.5}M`, 1500000);
	assert.is(count`${10} thousand`, 10000);
	assert.is(count`☃`, undefined);
});

test.run();
