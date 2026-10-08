export type Unit = 'K' | 'M' | 'B' | 'T';
export type Rounding = 'trunc' | 'floor' | 'ceil' | 'nearest';

export interface ShortenOptions {
	/** Maximum digits after the decimal point; trailing zeros are dropped. Default `0`. */
	decimals?: number;
	/** How to handle digits past `decimals`. Default `'trunc'` (toward zero). */
	rounding?: Rounding;
	/** Largest suffix allowed. Default `'T'`. */
	maxUnit?: Unit;
	/** Locale for digit grouping and the decimal separator. Default `'en-US'`. */
	locale?: string;
}

export type Shorten = (value: number, overrides?: ShortenOptions) => string;

export function createShorten(defaults?: ShortenOptions): Shorten;
export const shorten: Shorten;
export function parse(input: string): number | undefined;
export function count(strings: TemplateStringsArray, ...values: unknown[]): number | undefined;
