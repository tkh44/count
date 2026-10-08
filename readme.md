# count

> A tiny utility to shorten big numbers and parse them back: `12,669,477,740` → `12B`.

---

***NOTICE:** This follows the API style of [@tkh44/bytes](https://github.com/tkh44/bytes) and [@lukeed/ms](https://github.com/lukeed/ms), but for plain counts (K, M, B, T) instead of bytes or time.*

---

## Install

```
$ npm install --save @tkh44/count
```

## Usage

```js
import { shorten, createShorten, parse, count } from '@tkh44/count';

// number => string
shorten(12_669_477_740);                          //=> '12B'
shorten(12_669_477_740, { decimals: 2 });         //=> '12.66B'
shorten(12_669_477_740, { maxUnit: 'M' });        //=> '12,669M'
shorten(12_669_477_740, { rounding: 'nearest' }); //=> '13B'
shorten(74_853);                                  //=> '74K'
shorten(999);                                     //=> '999'

// string => number
parse('12B');        //=> 12000000000
parse('1.5k');       //=> 1500
parse('12,669M');    //=> 12669000000
parse('3 million');  //=> 3000000

// tagged template literal
count`12B`;          //=> 12000000000
count`${1.5}M`;      //=> 1500000
```

### One formatter for your whole app

Define your formatting rules once, then import them everywhere:

```js
// utils/count.js
import { createShorten } from '@tkh44/count';

export const shorten = createShorten({ decimals: 2 });
export const shortenAxis = createShorten();
export const shortenTable = createShorten({ decimals: 1, maxUnit: 'M' });
```

```js
import { shorten } from './utils/count';

`${shorten(credits)} cr · ${shorten(tokens)} tok · ${shorten(requests)} req`;
//=> '31.45K cr · 1.19B tok · 6.76K req'
```

## Rules

- **Units** are `K` (10³), `M` (10⁶), `B` (10⁹), and `T` (10¹²): short-scale counts, not bytes.
- **The largest unit wins** unless `maxUnit` caps it. Values below 1,000 get no suffix. Values beyond the cap are grouped: `1.5e15` → `'1,500T'`.
- **No decimals by default.** `decimals` sets the maximum; trailing zeros are dropped (`12.4B`, not `12.40B`).
- **Truncation by default.** Extra digits are dropped toward zero, so the output never overstates the value. Use `rounding` to change this.
- **Rounding up can promote the unit:** `999,999` with `rounding: 'nearest'` → `'1M'`, not `'1,000K'`. A `maxUnit` cap still wins: `'1,000M'`.
- Integer inputs are scaled with exact decimal math: `shorten(1150, { decimals: 2 })` → `'1.15K'`.

## API

### shorten(value, options?)
Returns: `String`

Shortens `value` using the default options. `NaN` and `±Infinity` are returned as `'NaN'` / `'Infinity'`.

#### options.decimals
Type: `Number`<br>
Default: `0`

Maximum digits after the decimal point, from `0` to `20`.

#### options.rounding
Type: `'trunc' | 'floor' | 'ceil' | 'nearest'`<br>
Default: `'trunc'`

How to handle digits past `decimals`:

| Mode | `12.669B` | `-12.669B` |
|---|---:|---:|
| `trunc`: toward zero | `12B` | `-12B` |
| `floor`: toward −∞ | `12B` | `-13B` |
| `ceil`: toward +∞ | `13B` | `-12B` |
| `nearest`: ties away from zero | `13B` | `-13B` |

#### options.maxUnit
Type: `'K' | 'M' | 'B' | 'T'`<br>
Default: `'T'`

Largest suffix allowed. Smaller values still use smaller units: `shorten(74853, { maxUnit: 'M' })` → `'74K'`.

#### options.locale
Type: `String`<br>
Default: `'en-US'`

Locale for digit grouping and the decimal separator. Suffixes stay `K`/`M`/`B`/`T`.

Invalid options throw a `RangeError`.

### createShorten(defaults?)
Returns: `(value, overrides?) => String`

Returns a `shorten` function with your defaults baked in. Per-call `overrides` win over `defaults`. Defaults are copied, so mutating the object later has no effect.

### parse(input)
Returns: `Number` | `undefined`

Parses a count string, or returns `undefined` if it can't be parsed. Case-insensitive; commas are ignored. Accepts `k`/`thousand`, `m`/`million`, `b`/`bn`/`billion`, and `t`/`tn`/`trillion`.

### count\`input\`
Returns: `Number` | `undefined`

Tagged template literal for `parse()`:

```js
count`10K`       // => 10000
count`${2.5}B`   // => 2500000000
```

## License

MIT © [Kye Hohenberger](https://github.com/tkh44)
