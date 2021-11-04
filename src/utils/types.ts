import * as WebSocket from "ws";

export enum CoinbinatorExchange {
	GENERIC = "GENERIC",
	BINANCE = "BINANCE",
	GATEIO = "GATEIO",
	MERCADO_BITCOIN = "MERCADO_BITCOIN",
}

export type CoinbinatorTicker = {
	id: string;
	exchange: CoinbinatorExchange;
	pair: string;
	price: string;
};

export type CoinbinatorDecoratedWebSocket = WebSocket & {
	session_id?: string;
};
