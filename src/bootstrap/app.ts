import { loop, uuid, value } from "../utils/helpers";
import { ApplicationActions, CoinbinatorDecoratedWebSocket, CoinbinatorExchange, CoinbinatorTicker } from "../utils/types";
import { ExchangeBinanceRepository } from "../repositories/exchange_binance_repository";
import { ExchangeMercadoBitcoinRepository } from "../repositories/exchange_mercadobitcoin_repository";
import WebserverRepository from "../repositories/webserver_repository";
import { WebSocket, Data as WsData } from "ws";
import { MySubscriptionsClientMessage, SetSocketIdClientMessage, SocketClientMessage, SocketClientMessageType, SubscribeToTickerClientMessage, UnsubscribeToTickerClientMessage } from "../utils/client_socket_messages";
import SubscribeToTickerAction from "./actions/subscribe_to_ticker_action";
import UnsubscribeToTickerAction from "./actions/unsubscribe_to_ticker_action";
import { norm_ticker_channel } from "../utils/parsers";
import MySubscriptionsAction from "./actions/my_subscriptions_action";
import { SocketServerMessageType, TickersServerMessage } from "../utils/server_socket_messages";
// import WebserverRepository from "../repositories/WebserverRepository";

/**
 * TODO: renomear para "AppRepository" ou somente "App"
 */
export class App {
	private _i: number = 1;

	/**
	 */
	private _actions: ApplicationActions;

	/**
	 */
	public get actions(): ApplicationActions {
		return this._actions;
	}

	/**
	 * Tickers grupped by exchange
	 */
	private tickers: Map<CoinbinatorExchange, Map<string, CoinbinatorTicker>> = new Map();

	/**
	 * All knowon/loaded tickers
	 */
	private tickers_all: Set<CoinbinatorTicker> = new Set();

	/**
	 * Tickers that changed after last "app" ticker dispatch
	 */
	private tickers_dirty: Set<CoinbinatorTicker> = new Set();

	/**
	 * Websockets connected to the app
	 */
	private client_websockets: Set<CoinbinatorDecoratedWebSocket> = new Set();

	private subscriptions: Map<string, Set<any>> = new Map();

	// private cli_program: SocketCliProgram = new SocketCliProgram(this);

	/**
	 * [Binance] repository
	 */
	private exchange_binance: ExchangeBinanceRepository;

	/**
	 * [Mercado Bitcoin] repository
	 */
	private exchange_mercadobitcoin: ExchangeMercadoBitcoinRepository;

	/**
	 * [Webserver] repository
	 */
	private webserver: WebserverRepository;

	constructor() {
		this.exchange_binance = new ExchangeBinanceRepository();
		this.exchange_mercadobitcoin = new ExchangeMercadoBitcoinRepository();
		this.webserver = new WebserverRepository();

		this._actions = {
			my_subscriptions: new MySubscriptionsAction(),
			subscribe_to_ticker: new SubscribeToTickerAction(),
			unsubscribe_to_ticker: new UnsubscribeToTickerAction(),
		};
	}

	async run() {
		//TODO: initialize databases
		//TODO: initialize knowuw symbols/tickers

		this.exchange_binance.init();
		this.exchange_mercadobitcoin.init();

		loop(5000, this.dispatch_dirty_tickers.bind(this));

		this.webserver.init();
	}

	/**
	 * @param socket
	 */
	register_client_websocket(socket: CoinbinatorDecoratedWebSocket) {
		socket.session_id = uuid();
		socket.subscriptions = new Set();
		socket.on("message", (message) => this.on_client_socket_message(socket, message));
		socket.on("close", (code, reason) => this.on_client_socket_close(socket, code, reason));

		this.client_websockets.add(socket);

		// this.send_message(socket, { type: "SetSocketId", id: socket.id });
	}

	private on_client_socket_message(socket: CoinbinatorDecoratedWebSocket, message: WsData) {
		const normalized_messages = this.on_client_socket_message__normalize_messages(message);
		console.log("Message:");
		console.log(message);
		console.log(normalized_messages);

		for (const normalized_message of normalized_messages) {
			if (normalized_message.type === SocketClientMessageType.SET_SOCKET_ID) {
				return;
			}

			if (normalized_message.type === SocketClientMessageType.SYMBOL_TICKER) {
				return;
			}

			if (normalized_message.type === SocketClientMessageType.MY_SUBSCRIPTIONS) {
				this.actions.my_subscriptions.execute(socket, normalized_message as MySubscriptionsClientMessage);
				return;
			}

			if (normalized_message.type === SocketClientMessageType.SUBSCRIBE_TO_TICKER) {
				this.actions.subscribe_to_ticker.execute(socket, normalized_message as SubscribeToTickerClientMessage);
				return;
			}

			if (normalized_message.type === SocketClientMessageType.UNSUBSCRIBE_TO_TICKER) {
				this.actions.unsubscribe_to_ticker.execute(socket, normalized_message as UnsubscribeToTickerClientMessage);
				return;
			}
		}

		// normalized_messages.forEach((message) => {
		// 	if (message.type === "MySubscriptions") {
		// 		this.subscribers.forEach((value, channel) => {
		// 			if (value.has(socket)) {
		// 				this.send_message(socket, channel);
		// 			}
		// 		});
		// 		return;
		// 	}

		// 	if (message.type === "SubscribeToSymbol") {
		// 		this.get_subscriber_channel(message.symbol, true)?.add(socket);
		// 		return;
		// 	}

		// 	if (message.type === "UnsubscribeToSymbol") {
		// 		this.get_subscriber_channel(message.symbol, false)?.delete(socket);
		// 		return;
		// 	}
		// });
	}

	private on_client_socket_close(socket: CoinbinatorDecoratedWebSocket, code: number, reason: Buffer | string) {
		socket.off("message", this.on_client_socket_message);
		socket.off("close", this.on_client_socket_close);

		this.client_websockets.delete(socket);

		this.subscriptions.forEach((value) => {
			value.delete(socket);
		});
	}

	private on_client_socket_message__normalize_messages(message: WsData): SocketClientMessage[] {
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

	send_message(socket: CoinbinatorDecoratedWebSocket, message: unknown) {
		const the_message = value(() => {
			if (typeof message === "undefined") return void 0;
			if (typeof message === "string") return message;

			return JSON.stringify(message);
		});

		console.log("sending...", message, the_message);

		if (typeof the_message === "undefined") return;

		socket.send(the_message);
	}

	get_subscriber_channel(channel: string, create: boolean = false) {
		if (!this.subscriptions.has(channel)) {
			this.subscriptions.set(channel, new Set());
		}
		return this.subscriptions.get(channel);
	}

	/**
	 * Returns a application ticker instance or creates a new one
	 *
	 * @param exchange
	 * @param pair
	 * @returns
	 */
	find_or_create_ticker(exchange: CoinbinatorExchange, pair: string): CoinbinatorTicker {
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
	 * Dispatches dirty tickers to subscribers
	 */
	dispatch_dirty_tickers() {
		const tickers = this.tickers_dirty.values();

		for (const socket of this.client_websockets) {
			const socket_ticker_subscriptions = Array.from(tickers).filter((ticker) => socket.subscriptions?.has(ticker.id));
			this.send_message(socket, {
				type: SocketServerMessageType.TICKERS,
				tickers: socket_ticker_subscriptions,
			} as TickersServerMessage);
		}

		this.tickers_dirty.clear();
	}
}

// class SocketCliProgram {
// 	private director: App;
// 	private program: Command;
// 	private messages: SocketMessage[] = [];

// 	constructor(director: App) {
// 		this.director = director;

// 		this.program = new Command();
// 		this.program.exitOverride();

// 		this.program.command("subs").action((symbol: string) => {
// 			this.messages.push({ type: "MySubscriptions" });
// 		});

// 		this.program.command("sub <symbol>").action((symbol: string) => {
// 			this.messages.push({ type: "SubscribeToSymbol", symbol: symbol });
// 		});

// 		this.program.command("unsub <symbol>").action((symbol: string) => {
// 			this.messages.push({ type: "UnsubscribeToSymbol", symbol: symbol });
// 		});

// 		// console.log(this.program.commands);
// 	}

// 	parse(cmd: string) {
// 		const messages = (this.messages = []);
// 		try {
// 			this.program.parse(["0", "0"].concat(cmd.split(/[ \t]+/)));
// 		} catch (err) {
// 			console.log(err);
// 		}
// 		return messages;
// 	}
// }
