import Pair from "@app/metas/pair";
import Pairs from "@app/metas/pairs";
import { loop, value, app, is_coin_usd_alias } from "@app/utils/helpers";
import { assert_valid_pair } from "@app/utils/parsers_and_normalizers";
import { CoinbinatorExchange, CoinbinatorTickerUpdate } from "@app/utils/types";
import Binance from "node-binance-api";
import { Event as WsEvent, MessageEvent as WsMessageEvent, WebSocket } from "ws";

export class ExchangeBinanceRepository {
	private binance_api: Binance;

	private binance_ws?: WebSocket;

	/**
	 * stores the conversion map, from binance format to coinbinator format of pairs
	 */
	private binance_pair_map: Map<string, Pair> = new Map();

	constructor() {
		this.binance_api = new Binance();
	}

	async init() {
		await this.refresh_exchange_info();

		loop(60000, this.refresh_exchange_info.bind(this));

		this.init_ws();
	}

	private async init_ws() {
		if (this.binance_ws) {
			// TODO: handle existing websocket client
		}
		this.binance_ws = new WebSocket("wss://stream.binance.com:9443/ws/!miniTicker@arr");
		this.binance_ws.addEventListener("open", this.ws_on_open.bind(this));
		this.binance_ws.addEventListener("close", this.ws_on_close.bind(this));
		this.binance_ws.addEventListener("message", this.ws_on_message.bind(this));
	}

	private async refresh_exchange_info() {
		try {
			const info = await this.binance_api.exchangeInfo();
			const symbols = info.symbols;

			for (const symbol_info of symbols) {
				this.binance_pair_map.set(
					//
					`${symbol_info.symbol}`,
					Pairs.get(symbol_info.baseAsset, symbol_info.quoteAsset, true)
				);
			}

			const prices = (await this.binance_api.prices()) as { [pro: string]: string };

			for (const i in prices) {
				const pair = this.norm_pair(i);
				const price = prices[`${pair.base}${pair.quote}`];

				this.emit_ticker({
					exchange: CoinbinatorExchange.BINANCE,
					pair: pair,
					price: price,
				});
			}
		} catch (err) {}
	}

	private async ws_on_open(event: WsEvent) {
		// TODO: adicionando
	}

	private async ws_on_close(event: WsEvent) {
		// TODO: handle socket disconnection
	}

	private async ws_on_message(event: WsMessageEvent) {
		const event_data = value(() => {
			if (typeof event.data === "string") return JSON.parse(event.data);
			if (Buffer.isBuffer(event.data)) return JSON.parse(event.data.toString("utf-8"));

			throw new Error("unable to parse WsMessageEvent");
		});

		for (const message of Array.isArray(event_data) ? event_data : [event_data]) {
			switch (true) {
				case message.e === "24hrMiniTicker":
					this.handle_ws_24hr_mini_ticker(message);
					break;
			}
			// console.log(message);
		}
	}

	private handle_ws_24hr_mini_ticker(message: WS__24hrMiniTicker) {
		const pair = this.norm_pair(message.s);

		if (typeof pair === "undefined") return;

		this.emit_ticker({
			exchange: CoinbinatorExchange.BINANCE,
			pair: pair,
			price: message.c,
		});
	}

	private emit_ticker(ticker: CoinbinatorTickerUpdate) {
		app().update_ticker(ticker);

		//NOTE: pair is USD related, emiting a USD ticker too
		if (is_coin_usd_alias(ticker.pair.quote)) {
			app().update_ticker({
				exchange: CoinbinatorExchange.BINANCE,
				pair: Pairs.get(ticker.pair.base, "USD", true),
				price: ticker.price,
			});
		}
	}

	/**
	 * @param pair
	 * @returns
	 */
	private norm_pair(pair: string): Pair {
		const norm_pair = this.binance_pair_map.get(pair);

		assert_valid_pair(norm_pair);

		return norm_pair;
	}
}

type WS__24hrMiniTicker = {
	e: "24hrMiniTicker";
	E: number;
	s: string;
	c: string;
	o: string;
	h: string;
	l: string;
	v: string;
	q: string;
};
