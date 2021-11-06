import * as WebSocket from "ws";
import { Pair } from "../metas/pair";

export enum CoinbinatorExchange {
	GENERIC = "GENERIC",
	BINANCE = "BINANCE",
	GATEIO = "GATEIO",
	MERCADO_BITCOIN = "MERCADO_BITCOIN",
}

export type CoinbinatorTicker = {
	id: string;
	exchange: CoinbinatorExchange;
	pair: Pair;
	price: string;
};

export type CoinbinatorDecoratedWebSocket = WebSocket & {
	session_id?: string;
};
