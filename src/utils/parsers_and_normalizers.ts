import { Data as WsData } from "ws";
import { format as sprintf } from "util";
import Pair from "@app/metas/pair";
import Pairs from "@app/metas/pairs";
import { ClientMessage } from "./client_socket_messages";
import { InvalidSymbolString, InvalidPairString, InvalidExchangeString } from "./errors";
import { CoinbinatorExchange } from "./types";

export function norm_symbol(symbol: string | undefined): string {
	return symbol?.toLocaleUpperCase()?.trim() || "";
}

export function norm_ticker_channel(channel: string): string | undefined {
	let { base, quote, exchange } = /^(TICKER\:)?(?<base>[^@]*)[\/\_](?<quote>[^@]*)(\@(?<exchange>[^\@]+))?$/gi.exec(channel?.toLocaleUpperCase() || "")?.groups || {};
	base = norm_symbol(base);
	quote = norm_symbol(quote);
	exchange = exchange?.trim()?.toLocaleUpperCase();

	if (!base || !quote) return void 0;

	return `TICKER:${base}/${quote}@${exchange || CoinbinatorExchange.GENERIC}`;
}

export function is_ticker_channel(ticker: string): boolean {
	return /^TICKER\:/gi.test(ticker);
}

export function split_ticker_channel(channel: string) {
	let { base, quote, exchange } = /^(TICKER\:)?(?<base>[^@]*)[\/\_](?<quote>[^@]*)(\@(?<exchange>[^\@]+))?$/gi.exec(channel?.toLocaleUpperCase() || "")?.groups || {};

	return {
		base,
		quote,
		exchange,
		pair: Pairs.get(base, quote, true),
		ticker: `${base}/${quote}@${exchange}`,
	};
}

/**
 * @param message
 * @returns
 */
export function norm_client_socket_messages(message: WsData): ClientMessage[] {
	let pre_messages: any = message;
	let messages: ClientMessage[] = [];

	if (typeof pre_messages === "string") {
		try {
			pre_messages = JSON.parse(pre_messages);
		} catch (err) {}
	}

	if (!Array.isArray(pre_messages)) {
		pre_messages = [pre_messages];
	}

	for (const pre_message of pre_messages) {
		if (typeof pre_message === "string") {
			// messages = messages.concat(this.cli_program.parse(pre_message));
			continue;
		}

		if (typeof pre_message === "object") {
			messages.push(pre_message as any as ClientMessage);
			continue;
		}

		console.warn("unable to normalize message", pre_message);
	}

	return messages;
}

export function split_pair(pair: string | undefined): { base: string; quote: string } {
	assert_valid_pair_string(pair);

	let { base, quote } = /^(?<base>[^@]*)[\/\_](?<quote>[^@]*)/gi.exec(pair?.toLocaleUpperCase() || "")?.groups || {};

	assert_valid_symbol_string(base);
	assert_valid_symbol_string(quote);

	return { base, quote };
}

export function assert_valid_symbol_string(symbol: string | unknown): asserts symbol is string {
	if (typeof symbol !== "string") throw new InvalidSymbolString(sprintf(`invalid symbol string: "%s"`, symbol));
	if (symbol === "") throw new InvalidSymbolString(sprintf(`invalid symbol string: "%s"`, symbol));
}

export function assert_valid_pair_string(pair: string | unknown): asserts pair is string {
	if (typeof pair !== "string") throw new InvalidPairString(sprintf(`invalid pair string: "%s"`, pair));
	if (pair === "") throw new InvalidPairString(sprintf(`invalid pair string: "%s"`, pair));
}

export function assert_valid_pair(pair: Pair | undefined): asserts pair is Pair {
	if (typeof pair === "undefined") throw new InvalidPairString(sprintf(`invalid pair: "%s"`, JSON.stringify(pair)));
	if (!(pair instanceof Pair)) throw new InvalidPairString(sprintf(`pair is not instance of Pair: "%s"`, JSON.stringify(pair)));
}

export function assert_valid_exchange(exchange: string): asserts exchange is CoinbinatorExchange {
	console.log(Object.keys(CoinbinatorExchange));

	if (Object.keys(CoinbinatorExchange).indexOf(exchange) === -1) throw new InvalidExchangeString(sprintf(`Invalid exchange string: %s`, JSON.stringify(exchange)));
}
