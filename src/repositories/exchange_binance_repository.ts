import Binance from "node-binance-api";
import { Event as WsEvent, MessageEvent as WsMessageEvent, WebSocket } from "ws";
import { app, value } from "../utils/helpers";
import { norm_ticker_channel } from "../utils/parsers_and_normalizers";
import { CoinbinatorExchange } from "../utils/types";

export class ExchangeBinanceRepository {
	private binance: Binance;

	private ws_client?: WebSocket;

	private pair_map: Map<string, string> = new Map();

	// refresh_exchange_id?: NodeJS.Timer;
	// refreshing_exchange: boolean = false;

	constructor() {
		this.binance = new Binance();
	}

	async init() {
		this.refresh_info();

		this.init_ws();
	}

	private async refresh_info() {
		try {
			const info = await this.binance.exchangeInfo();
			const symbols = info.symbols;

			for (const symbol_info of symbols) {
				this.pair_map.set(
					//
					`${symbol_info.symbol}`,
					`${symbol_info.baseAsset}_${symbol_info.quoteAsset}`.toLocaleUpperCase()
				);
			}
		} catch (err) {}
	}

	async init_ws() {
		if (this.ws_client) {
			// TODO: handle existing websocket client
		}
		this.ws_client = new WebSocket("wss://stream.binance.com:9443/ws/!miniTicker@arr");
		this.ws_client.addEventListener("open", this.ws_on_open.bind(this));
		this.ws_client.addEventListener("close", this.ws_on_close.bind(this));
		this.ws_client.addEventListener("message", this.ws_on_message.bind(this));
	}

	async ws_on_open(event: WsEvent) {
		// TODO: adicionando
	}

	async ws_on_close(event: WsEvent) {}

	async ws_on_message(event: WsMessageEvent) {
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

		if (pair === void 0) return;

		app().update_ticker({
			exchange: CoinbinatorExchange.BINANCE,
			id: `${pair}@${CoinbinatorExchange.BINANCE}`,
			pair: pair,
			price: message.c,
		});
	}

	norm_pair(s: string): string | undefined {
		return this.pair_map.get(s);
	}

	// async refresh_exchange(): Promise<void> {
	// 	if (this.refreshing_exchange) return;
	// 	console.log("refreshing binance...");
	// 	this.refreshing_exchange = true;
	// 	///

	// 	// const markets = await this.binance.loadMarkets();
	// 	const tickers = await this.binance.fetchTickers();
	// 	for (const symbol in tickers) {
	// 		const ticker = tickers[symbol];

	// 		// if (ticker.symbol !== "BTC/USDT") continue;

	// 		if (ticker.last) app().register_ticker(symbol, ticker);

	// 		// console.log(ticker);
	// 		// break;
	// 	}

	// 	// console.log(tickers);

	// 	///
	// 	this.refreshing_exchange = false;
	// 	console.log("done.");
	// }

	// initialize() {
	// 	this.refresh_exchange_id = setInterval(() => this.refresh_exchange(), 30 * 1000);
	// }
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
