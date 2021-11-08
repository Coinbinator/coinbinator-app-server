import { Pair } from "../metas/pair";
import CoinbinatorTicker from "../metas/ticker";
import { CoinbinatorExchange } from "./types";

export enum ServerMessageType {
	SUBSCRIPTIONS = "Subscriptions",
	TICKERS = "Tickers",
}
export type ServerMessage = SubscriptionsServerMessage | TickersServerMessage;

export type SubscriptionsServerMessage = {
	//
	type: ServerMessageType.SUBSCRIPTIONS;
	subscriptions: string[];
};

export type TickersServerMessage = {
	//
	type: ServerMessageType.TICKERS;
	tickers: TickersServerMessage_Ticker[];
	computed_tickers: TickersServerMessage_Ticker[];
};

export type TickersServerMessage_Ticker = {
	exchange: CoinbinatorExchange;
	pair: string;
	price: string;
};
