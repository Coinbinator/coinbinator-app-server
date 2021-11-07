import CoinbinatorTicker from "../metas/ticker";

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
	tickers: CoinbinatorTicker[];
};
