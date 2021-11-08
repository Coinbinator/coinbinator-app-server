import { CoinbinatorDecoratedWebSocket, CoinbinatorExchange, CoinbinatorTickerUpdate } from "../utils/types";
import { Data as WsData } from "ws";
import { ExchangeBinanceRepository } from "../repositories/exchange_binance_repository";
import { ExchangeMercadoBitcoinRepository } from "../repositories/exchange_mercadobitcoin_repository";
import { is_coin_alias, loop, mapset_put_if_missing, uuid, value } from "../utils/helpers";
import { MySubscriptionsClientMessage, SocketClientMessageType, SubscribeToTickerClientMessage, SubscribeToTickersClientMessage, UnsubscribeToTickerClientMessage } from "../utils/client_socket_messages";
import { norm_client_socket_messages, norm_ticker_channel, split_ticker_channel } from "../utils/parsers_and_normalizers";
import { Pair } from "../metas/pair";
import { Request } from "express";
import { ServerMessage, ServerMessageType, SubscriptionsServerMessage } from "../utils/server_socket_messages";
import assert from "assert";
import WebserverRepository from "../repositories/webserver_repository";
import wu from "wu";
import Pairs from "../metas/pairs";
import CoinbinatorTicker from "../metas/ticker";
import { tickers_server_message_resource } from "./transformers";

export class App {
	/**
	 * Ticker quotes that we will try our best to provide to clients
	 *
	 * eg: if Pair(any, 'BRL') is missing from some exchange we will try to create an aproximation with multiple pairs conversion
	 */
	readonly granted_ticker_quotes = new Set(["BTC", "USD", "BRL"]);

	/**
	 * Tickers grupped by exchange
	 */
	readonly exchange_pairs: Map<CoinbinatorExchange, Set<Pair>> = new Map();

	/**
	 * Tickers grupped by exchange
	 */
	readonly tickers: Map<CoinbinatorExchange, Map<Pair, CoinbinatorTicker>> = new Map();

	/**
	 * All knowon/loaded tickers
	 */
	readonly tickers_all: Set<CoinbinatorTicker> = new Set();

	/**
	 * Tickers that changed after last "app" ticker dispatch
	 */
	readonly tickers_dirty: Set<CoinbinatorTicker> = new Set();

	/**
	 * Tickers that are computed to enable "granted" tickers
	 */
	readonly tickers_computed: Map<Pair, CoinbinatorTicker> = new Map();

	/**
	 * Websockets connected to the app
	 */
	readonly clients_sockets: Set<CoinbinatorDecoratedWebSocket> = new Set();

	/**
	 * Subscriptions (by channel)
	 */
	readonly subscriptions_by_channel: Map<string, Set<CoinbinatorDecoratedWebSocket>> = new Map();

	/**
	 * Subscriptions (by socket_client)
	 */
	readonly subscriptions_by_client: Map<CoinbinatorDecoratedWebSocket, Set<string>> = new Map();

	/**
	 * [Binance] repository
	 */
	readonly exchange_binance: ExchangeBinanceRepository;

	/**
	 * [Mercado Bitcoin] repository
	 */
	readonly exchange_mercadobitcoin: ExchangeMercadoBitcoinRepository;

	/**
	 * [Webserver] repository
	 */
	readonly webserver: WebserverRepository;

	/**
	 */
	constructor() {
		this.exchange_binance = new ExchangeBinanceRepository();
		this.exchange_mercadobitcoin = new ExchangeMercadoBitcoinRepository();
		this.webserver = new WebserverRepository();
	}

	/**
	 * Start application
	 */
	async run() {
		//TODO: initialize databases
		//TODO: initialize knowuw symbols/tickers

		this.exchange_binance.init();
		this.exchange_mercadobitcoin.init();

		this.update_cumputed_tickers.bind(this);

		loop(2000, this.update_cumputed_tickers.bind(this));
		loop(5000, this.flush_dirty_tickers.bind(this));

		this.webserver.init();
	}

	/**
	 * Handles new socket client connection
	 * @param socket
	 */
	on_client_socket_connect(socket: CoinbinatorDecoratedWebSocket, request: Request) {
		socket.session_id = uuid();

		socket.on("message", (message) => this.on_client_socket_message(socket, message));
		socket.on("close", (code, reason) => this.on_client_socket_close(socket, code, reason));

		this.clients_sockets.add(socket);
		this.subscriptions_by_client.set(socket, new Set());

		console.log("client, connected");
	}

	/**
	 * @param socket
	 * @param message
	 * @returns
	 */
	on_client_socket_message(socket: CoinbinatorDecoratedWebSocket, message: WsData) {
		const normalized_messages = norm_client_socket_messages(message);

		console.log("Message:");
		console.log(message);
		console.log(normalized_messages);

		for (const normalized_message of normalized_messages) {
			if (normalized_message.type === SocketClientMessageType.SET_SOCKET_ID) {
				return;
			}

			if (normalized_message.type === SocketClientMessageType.MY_SUBSCRIPTIONS) {
				this.handle_client_message__my_subscriptions(socket, normalized_message as MySubscriptionsClientMessage);
				return;
			}

			if (normalized_message.type === SocketClientMessageType.SUBSCRIBE_TO_TICKER) {
				this.handle_client_message__subscribe_to_ticker(socket, normalized_message as SubscribeToTickerClientMessage);
				return;
			}

			if (normalized_message.type === SocketClientMessageType.SUBSCRIBE_TO_TICKERS) {
				this.handle_client_message__subscribe_to_tickers(socket, normalized_message as SubscribeToTickersClientMessage);
				return;
			}

			if (normalized_message.type === SocketClientMessageType.UNSUBSCRIBE_TO_TICKER) {
				this.handle_client_message__unsubscribe_to_ticker(socket, normalized_message as UnsubscribeToTickerClientMessage);
				return;
			}
		}
	}
	/**
	 * @param socket
	 * @param message
	 */
	handle_client_message__my_subscriptions(socket: CoinbinatorDecoratedWebSocket, message: MySubscriptionsClientMessage) {
		this.socket_send_message(socket, {
			type: ServerMessageType.SUBSCRIPTIONS,
			subscriptions: wu(this.get_subscriptions_by_client(socket) || []).toArray(),
		} as SubscriptionsServerMessage);
	}

	/**
	 * @param socket
	 * @param message
	 */
	handle_client_message__subscribe_to_ticker(socket: CoinbinatorDecoratedWebSocket, message: SubscribeToTickerClientMessage) {
		const ticker = norm_ticker_channel(message.ticker);

		console.log(ticker);

		if (typeof ticker === "undefined") return;

		this.get_subscriptions_by_channel(ticker, true)?.add(socket);
		this.get_subscriptions_by_client(socket)?.add(ticker);
	}

	/**
	 * @param socket
	 * @param message
	 */
	handle_client_message__subscribe_to_tickers(socket: CoinbinatorDecoratedWebSocket, message: SubscribeToTickersClientMessage) {
		console.log("---");
		console.log(message);

		for (const t of message.tickers) {
			const ticker = norm_ticker_channel(t);

			console.log(ticker);

			if (typeof ticker === "undefined") continue;

			this.get_subscriptions_by_channel(ticker, true)?.add(socket);
			this.get_subscriptions_by_client(socket)?.add(ticker);
		}

		const subscriptions = this.get_subscriptions_by_client(socket);
		const tickets = wu(this.tickers_all)
			.filter((ticker) => subscriptions?.has(ticker.id) === true)
			.toArray();

		if (tickets.length === 0) return;

		this.socket_send_message(
			socket,
			tickers_server_message_resource.transform({
				tickers: tickets,
				computed_tickers: [],
			})
		);
	}

	/**
	 * @param socket
	 * @param message
	 * @returns
	 */
	handle_client_message__unsubscribe_to_ticker(socket: CoinbinatorDecoratedWebSocket, message: UnsubscribeToTickerClientMessage) {
		const ticker = norm_ticker_channel(message.ticker);

		if (typeof ticker === "undefined") return;

		this.get_subscriptions_by_channel(ticker)?.add(socket);
		this.get_subscriptions_by_client(socket)?.add(ticker);
	}

	/**
	 * @param socket
	 * @param code
	 * @param reason
	 */
	on_client_socket_close(socket: CoinbinatorDecoratedWebSocket, code: number, reason: Buffer | string) {
		// NOTE: cleaning up socket references
		this.subscriptions_by_client.delete(socket);
		this.subscriptions_by_channel.forEach((value) => value.delete(socket));
		this.clients_sockets.delete(socket);

		console.log("client, closed");
	}

	/**
	 * @param socket
	 * @param message
	 * @returns
	 */
	socket_send_message(socket: CoinbinatorDecoratedWebSocket, message: unknown | ServerMessage) {
		const the_message = value(() => {
			if (typeof message === "undefined") return void 0;
			if (typeof message === "string") return message;

			return JSON.stringify(message);
		});

		// console.log("sending...", message, the_message);

		if (typeof the_message === "undefined") return;

		socket.send(the_message);
	}

	/**
	 * @param channel
	 * @param create_if_missing
	 * @returns
	 */
	get_subscriptions_by_channel(channel: string, create_if_missing: boolean = false) {
		if (false === this.subscriptions_by_channel.has(channel) && true === create_if_missing) {
			this.subscriptions_by_channel.set(channel, new Set());
		}
		return this.subscriptions_by_channel.get(channel);
	}

	/**
	 * @param socket
	 * @returns
	 */
	get_subscriptions_by_client(socket: CoinbinatorDecoratedWebSocket): Set<string> | undefined {
		return this.subscriptions_by_client.get(socket);
	}

	/**
	 * Returns a application ticker instance
	 *
	 * @param exchange
	 * @param pair
	 * @returns
	 */
	find_ticker(exchange: CoinbinatorExchange, pair: Pair): CoinbinatorTicker | undefined {
		return this.tickers?.get(exchange)?.get(pair);
	}

	/**
	 * Returns a application ticker instance or creates a new one
	 *
	 * @param exchange
	 * @param pair
	 * @returns
	 */
	find_or_create_ticker(exchange: CoinbinatorExchange, pair: Pair): CoinbinatorTicker {
		if (this.tickers?.get(exchange)?.has(pair) === true) {
			return this.tickers.get(exchange)!.get(pair)!;
		}

		const ticker = new CoinbinatorTicker(exchange, pair);

		// NOTE: creating exchange map if not exists
		if (!this.tickers.has(exchange)) this.tickers.set(exchange, new Map());

		// NOTE: registering new tickers
		this.tickers.get(exchange)!.set(pair, ticker);
		this.tickers_all.add(ticker);

		return ticker;
	}

	/**
	 * Updates the application ticker state
	 *
	 * @param ticker
	 */
	update_ticker(ticker: CoinbinatorTickerUpdate) {
		const generic_ticker = this.find_or_create_ticker(CoinbinatorExchange.GENERIC, ticker.pair);
		const exchange_ticker = this.find_or_create_ticker(ticker.exchange, ticker.pair);

		generic_ticker.price = ticker.price;
		exchange_ticker.price = ticker.price;

		this.tickers_dirty.add(generic_ticker);
		this.tickers_dirty.add(exchange_ticker);

		mapset_put_if_missing(this.exchange_pairs, generic_ticker.exchange, generic_ticker.pair);
		mapset_put_if_missing(this.exchange_pairs, exchange_ticker.exchange, exchange_ticker.pair);
	}

	/**
	 * Flushes dirty tickers to socket clients
	 */
	flush_dirty_tickers() {
		this.clients_sockets.forEach((socket) => {
			const client_subscriptions = this.get_subscriptions_by_client(socket);

			assert(client_subscriptions instanceof Set);

			const tickers = wu(this.tickers_dirty)
				.filter((ticker) => client_subscriptions.has(ticker.channel) === true)
				.toArray();

			const missing_tickers = wu(client_subscriptions)
				.reject((sub) => typeof tickers.find((ticker) => ticker.channel === sub) !== "undefined")
				.map((sub) => {
					const { pair } = split_ticker_channel(sub);

					if (!this.tickers_computed.get(pair)) {
						console.log(this.tickers_computed.get(pair), pair);
					}

					return this.tickers_computed.get(pair)!;
				})
				.filter((ticker) => !!ticker)
				.toArray();

			//NOTE: no tickers to send
			if (tickers.length === 0 && missing_tickers.length === 0) {
				return;
			}

			this.socket_send_message(
				socket,
				tickers_server_message_resource.transform({
					tickers: tickers,
					computed_tickers: missing_tickers,
				})
			);
		});

		this.tickers_dirty.clear();
	}

	/**
	 * Compute granted pairs ticker, through arbritage
	 */
	update_cumputed_tickers() {
		//NOTE: we will grant all granted quote combinations
		for (const granted_base of this.granted_ticker_quotes) {
			for (const granted_quote of this.granted_ticker_quotes) {
				this.update_cumputed_tickers__compute_ticker(granted_base, granted_quote);
			}
		}

		//NOTE: compute all missing base symbols
		for (const granted_quote_symbol of this.granted_ticker_quotes) {
			const granted_base_symbols = wu(this.exchange_pairs.get(CoinbinatorExchange.GENERIC) || [])
				.filter((pair) => is_coin_alias(granted_quote_symbol, pair.quote))
				.map((pair) => pair.base)
				.unique()
				.toArray()
				.sort();

			granted_base_symbols.concat(Array.from(this.granted_ticker_quotes));

			const missing_base_symbols = wu(this.exchange_pairs.get(CoinbinatorExchange.GENERIC) || [])
				.filter((pair) => granted_base_symbols.indexOf(pair.base) === -1)
				.map((pair) => pair.base)
				.unique()
				.toArray()
				.sort();

			for (const missing_base_symbol of missing_base_symbols) {
				this.update_cumputed_tickers__compute_ticker(missing_base_symbol, granted_quote_symbol);
			}
		}
	}

	/**
	 * Compute arbritage price between two pairs
	 *
	 * @param base
	 * @param quote
	 */
	update_cumputed_tickers__compute_ticker(base: string, quote: string) {
		const path = this.find_ticker_hops([], base, quote);

		// NOTE: skips computation of 'equal and similar' symbols (eg.: USD ==> USDT )
		if (is_coin_alias(base, quote)) {
			return;
		}

		if (typeof path === "undefined") {
			// console.warn(format('unable to find path from "%s" to "%s"', base, quote));
			return;
		}

		const pair = Pairs.get(base, quote, true);

		const computed_price = wu(path)
			.map((pair) => {
				const ticker_a = this.find_ticker(CoinbinatorExchange.GENERIC, pair);
				if (typeof ticker_a !== "undefined") return ticker_a.price;

				const ticker_b = this.find_ticker(CoinbinatorExchange.GENERIC, Pairs.get(pair.quote, pair.base, true));
				if (typeof ticker_b !== "undefined") return (1 / parseFloat(ticker_b.price)).toString();

				return "1";
			})
			.reduce((a, b) => a * parseFloat(b), 1);

		// const computed_price = path.reduce((price, pair) => {
		// 	const ticker = this.find_or_create_ticker(CoinbinatorExchange.GENERIC, pair);
		// 	return price * parseFloat(ticker.price);
		// }, 1);

		if (!this.tickers_computed.has(pair)) {
			this.tickers_computed.set(pair, new CoinbinatorTicker(CoinbinatorExchange.GENERIC, pair));
		}

		this.tickers_computed.get(pair)!.price = computed_price.toString();
	}

	/**
	 * lookup for path between two tickers, to calculate arbritage of missing pairs
	 *
	 * @param path
	 * @param from_symbol
	 * @param to_symbol
	 * @param idn
	 * @returns
	 */
	find_ticker_hops(path: Pair[], from_symbol: string, to_symbol: string, idn: string | undefined = void 0): Pair[] | undefined {
		if (typeof idn === "undefined") idn = `${from_symbol}/${to_symbol}`;

		if (is_coin_alias(from_symbol, to_symbol)) return void 0;

		const tickers = this.tickers.get(CoinbinatorExchange.GENERIC) || [];

		for (const [pair] of tickers) {
			if (path.indexOf(pair) > -1) continue;

			if (from_symbol === pair.base && to_symbol === pair.quote) {
				return [...path, Pairs.get(from_symbol, to_symbol, true)];
			}
			if (to_symbol === pair.base && from_symbol === pair.quote) {
				return [...path, Pairs.get(to_symbol, from_symbol, true)];
			}
		}

		let best_path: Pair[] | undefined;
		let best_path_changed = false;

		for (const [pair] of tickers) {
			if (path.findIndex((pair_in_path) => pair_in_path.idn === pair.idn) > -1) continue;

			if (from_symbol === pair.base) {
				const test = this.find_ticker_hops([...path, pair], pair.quote, to_symbol, idn);

				if (typeof test !== "undefined" && (typeof best_path === "undefined" || test.length < best_path.length)) {
					best_path = test;
					best_path_changed = true;
				}
			}

			if (from_symbol === pair.quote) {
				const test = this.find_ticker_hops([...path, Pairs.get(pair.quote, pair.base, true)], pair.base, to_symbol, idn);

				if (typeof test !== "undefined" && (typeof best_path === "undefined" || test.length < best_path.length)) {
					best_path = test;
					best_path_changed = true;
				}
			}

			// NOTE: stop search if we found a optinal (2 or less hops) path
			if (best_path_changed && best_path) {
				if (best_path.length <= 2) return best_path;
				best_path_changed = false;
			}
		}

		return best_path;
	}
}
