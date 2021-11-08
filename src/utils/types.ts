import * as WebSocket from "ws";
import { Pair } from "../metas/pair";

export enum CoinbinatorExchange {
	GENERIC = "GENERIC",
	BINANCE = "BINANCE",
	GATEIO = "GATEIO",
	MERCADO_BITCOIN = "MERCADO_BITCOIN",
}

export type CoinbinatorDecoratedWebSocket = WebSocket & {
	session_id?: string;
};

export enum CoinbinatorClientSubscriptionType {
	TICKER_SUBSCRIPTION = "TICKER_SUBSCRIPTION",
}

export type CoinbinatorTickerUpdate = {
	exchange: CoinbinatorExchange;
	pair: Pair;
	price: string;
};
