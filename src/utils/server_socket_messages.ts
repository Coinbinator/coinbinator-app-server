import { CoinbinatorExchange } from "./types";

export enum ServerMessageType {
	SUBSCRIPTIONS = "subscriptions",
	TICKERS = "tickers",
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
	tickers_computed: TickersServerMessage_Ticker[];
};

export type TickersServerMessage_Ticker = {
	exchange: CoinbinatorExchange;
	pair: string;
	price: string;
};
