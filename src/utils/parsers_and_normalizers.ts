import { CoinbinatorExchange } from "./types";
import { WebSocket, Data as WsData } from "ws";
import { SocketClientMessage } from "./client_socket_messages";

export function norm_symbol(symbol: string | undefined): string {
	return symbol?.toLocaleUpperCase()?.trim() || "";
}

export function norm_ticker_channel(ticker: string): string | undefined {
	let { base, quote, exchange } = /^(?<base>[^@]*)\/(?<quote>[^@]*)(\@(?<exchange>[^\@]+))?$/gi.exec(ticker?.toLocaleUpperCase() || "")?.groups || {};
	base = norm_symbol(base);
	quote = norm_symbol(quote);
	exchange = exchange?.trim()?.toLocaleUpperCase();

	if (!base || !quote) return void 0;

	return `${base}_${quote}@${exchange || CoinbinatorExchange.GENERIC}`;
}

/**
 * @param message
 * @returns
 */
export function norm_client_socket_messages(message: WsData): SocketClientMessage[] {
	let pre_messages: any = message;
	let messages: SocketClientMessage[] = [];

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
			messages.push(pre_message as any as SocketClientMessage);
			continue;
		}

		console.warn("unable to normalize message", pre_message);
	}

	return messages;
}
