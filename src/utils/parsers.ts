import { CoinbinatorExchange } from "./types";

export function norm_symbol(symbol: string | undefined): string {
	return symbol?.toLocaleUpperCase()?.trim() || "";
}

export function norm_ticker_channel(ticker: string): string | undefined {
	let { base, quote, exchange } = /^(?<base>[^@]*)\/(?<quote>[^@]*)(\@(?<exchange>[^\@]+))?$/ig.exec(ticker?.toLocaleUpperCase() || "")?.groups || {};
	base = norm_symbol(base);
	quote = norm_symbol(quote);
	exchange = exchange?.trim()?.toLocaleUpperCase();

	if (!base || !quote) return void 0;

	return `${base}_${quote}@${exchange || CoinbinatorExchange.GENERIC}`;
}
