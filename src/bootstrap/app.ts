import { loop } from "../utils/helpers";
import { CoinbinatorExchange, CoinbinatorTicker } from "../utils/types";
import { ExchangeBinanceRepository } from "../repositories/exchange_binance_repository";
import { ExchangeMercadoBitcoinRepository } from "../repositories/exchange_mercadobitcoin_repository";
import WebserverRepository from "../repositories/webserver_repository";
// import WebserverRepository from "../repositories/WebserverRepository";

/**
 * TODO: renomear para "AppRepository" ou somente "App"
 */
export class App {
	private _i: number = 1;

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
	private client_websockets: Set<any> = new Set();

	private subscribers: Map<string, Set<any>> = new Map();

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
	}

	async run() {
		//TODO: initialize databases
		//TODO: initialize knowuw symbols/tickers

		this.exchange_binance.init();
		this.exchange_mercadobitcoin.init();

		loop(5000, this.dispatch_dirty_tickers.bind(this));

		this.webserver.init();
	}

	// register_socket(socket: WebSocketPlus) {
	// 	socket.id = uuid();
	// 	this.sockets.add(socket);

	// 	socket.on("message", (message) => this.on_socket_message(socket, message));
	// 	socket.on("close", (code, reason) => this.on_socket_close(socket, code, reason));

	// 	this.send_message(socket, { type: "SetSocketId", id: socket.id });
	// }

	// private on_socket_message__normalize_messages(message: WebSocket.Data): SocketMessage[] {
	// 	let pre_messages: any = message;
	// 	let messages: SocketMessage[] = [];

	// 	if (typeof pre_messages === "string") {
	// 		try {
	// 			pre_messages = JSON.parse(pre_messages);
	// 		} catch (err) {}
	// 	}

	// 	if (pre_messages && pre_messages.constructor !== Array) {
	// 		pre_messages = [pre_messages];
	// 	}

	// 	for (const pre_message of pre_messages) {
	// 		if (typeof pre_message === "string") {
	// 			// messages = messages.concat(this.cli_program.parse(pre_message));
	// 			continue;
	// 		}

	// 		if (typeof pre_message === "object") {
	// 			messages.push(pre_message as any as SocketMessage);
	// 			continue;
	// 		}

	// 		console.warn("unable to normalize message", pre_message);
	// 	}

	// 	return messages;
	// }

	// private on_socket_message(socket: WebSocketPlus, message: WebSocket.Data) {
	// 	const normalized_messages = this.on_socket_message__normalize_messages(message);
	// 	// console.log("Message:");
	// 	// console.log(message);
	// 	// console.log(normalized_messages);

	// 	normalized_messages.forEach((message) => {
	// 		if (message.type === "MySubscriptions") {
	// 			this.subscribers.forEach((value, channel) => {
	// 				if (value.has(socket)) {
	// 					this.send_message(socket, channel);
	// 				}
	// 			});
	// 			return;
	// 		}

	// 		if (message.type === "SubscribeToSymbol") {
	// 			this.get_subscriber_channel(message.symbol, true)?.add(socket);
	// 			return;
	// 		}

	// 		if (message.type === "UnsubscribeToSymbol") {
	// 			this.get_subscriber_channel(message.symbol, false)?.delete(socket);
	// 			return;
	// 		}
	// 	});
	// }

	// private on_socket_close(socket: WebSocketPlus, code: number, reason: Buffer | string) {
	// 	// console.log("ccc", code, reason);

	// 	this.sockets.delete(socket);

	// 	this.subscribers.forEach((value) => {
	// 		value.delete(socket);
	// 	});
	// }

	// private send_message(socket: WebSocketPlus, message: SocketMessage | string) {
	// 	const the_message = (() => {
	// 		if (typeof message === "string") return message;

	// 		return JSON.stringify(message);
	// 	})();

	// 	socket.send(the_message);
	// }

	get_subscriber_channel(channel: string, create: boolean = false) {
		if (!this.subscribers.has(channel)) {
			this.subscribers.set(channel, new Set());
		}
		return this.subscribers.get(channel);
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
