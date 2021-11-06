import { loop, uuid, value } from "../utils/helpers";
import { CoinbinatorDecoratedWebSocket, CoinbinatorExchange, CoinbinatorTicker } from "../utils/types";
import { ExchangeBinanceRepository } from "../repositories/exchange_binance_repository";
import { ExchangeMercadoBitcoinRepository } from "../repositories/exchange_mercadobitcoin_repository";
import WebserverRepository from "../repositories/webserver_repository";
import { Data as WsData } from "ws";
import { MySubscriptionsClientMessage, SocketClientMessageType, SubscribeToTickerClientMessage, SubscribeToTickersClientMessage, UnsubscribeToTickerClientMessage } from "../utils/client_socket_messages";
import { norm_client_socket_messages, norm_ticker_channel } from "../utils/parsers_and_normalizers";
import { Request } from "express";
import wu from "wu";
import { ServerMessage, ServerMessageType, SubscriptionsServerMessage, TickersServerMessage } from "../utils/server_socket_messages";

import { Pair } from "../metas/pair";

export class App {
	/**
	 * Pairs statics meta
	 */
	readonly pairs: Map<string, Pair> = new Map();

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

		loop(5000, this.flush_dirty_tickers.bind(this));

		this.webserver.init();
	}

	/**
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

		if (typeof ticker === "undefined") return;

		this.get_subscriptions_by_channel(ticker, true)?.add(socket);
		this.get_subscriptions_by_client(socket)?.add(ticker);
	}

	/**
	 * @param socket
	 * @param message
	 */
	handle_client_message__subscribe_to_tickers(socket: CoinbinatorDecoratedWebSocket, message: SubscribeToTickersClientMessage) {
		for (const t of message.tickers) {
			const ticker = norm_ticker_channel(t);

			if (typeof ticker === "undefined") continue;

			this.get_subscriptions_by_channel(ticker, true)?.add(socket);
			this.get_subscriptions_by_client(socket)?.add(ticker);
		}

		const subscriptions = this.get_subscriptions_by_client(socket);
		const tickets = wu(this.tickers_all)
			.filter((ticket) => subscriptions?.has(ticket.id) === true)
			.toArray();

		if (tickets.length === 0) return;

		this.socket_send_message(socket, {
			type: ServerMessageType.TICKERS,
			tickers: tickets,
		} as TickersServerMessage);
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
	 * Returns a application ticker instance or creates a new one
	 *
	 * @param exchange
	 * @param pair
	 * @returns
	 */
	find_or_create_ticker(exchange: CoinbinatorExchange, pair: Pair): CoinbinatorTicker {
		if (this.tickers?.get(exchange)?.has(pair) === true) {
			return this.tickers?.get(exchange)?.get(pair) as any as CoinbinatorTicker;
		}

		const ticker = {
			// i: this._i++,
			id: `${pair}@${exchange}`,
			exchange: exchange,
			pair: pair,
			price: "-1",
		};

		// NOTE: creating exchange map if not exists
		if (!this.tickers.has(exchange)) this.tickers.set(exchange, new Map());

		// NOTE: registering new tickers
		this.tickers.get(exchange)?.set(pair, ticker);
		this.tickers_all.add(ticker);

		return ticker;
	}

	/**
	 * Updates the application ticker state
	 *
	 * @param ticker
	 */
	update_ticker(ticker: CoinbinatorTicker) {
		const generic_ticker = this.find_or_create_ticker(CoinbinatorExchange.GENERIC, ticker.pair);
		const exchange_ticker = this.find_or_create_ticker(ticker.exchange, ticker.pair);

		generic_ticker.price = ticker.price;
		exchange_ticker.price = ticker.price;

		this.tickers_dirty.add(generic_ticker);
		this.tickers_dirty.add(exchange_ticker);
	}

	/**
	 * Dispatches dirty tickers to socket clients
	 */
	flush_dirty_tickers() {
		this.clients_sockets.forEach((socket) => {
			const client_subscriptions = this.get_subscriptions_by_client(socket);

			const tickers = wu(this.tickers_dirty)
				.filter((ticker) => client_subscriptions?.has(ticker.id) === true)
				.toArray();

			// NOTE: not subscribed to any dirty ticker
			if (tickers.length === 0) return;

			this.socket_send_message(socket, {
				type: ServerMessageType.TICKERS,
				tickers: tickers,
			} as TickersServerMessage);
		});

		this.tickers_dirty.clear();
	}
}
