export enum SocketClientMessageType {
	MY_SUBSCRIPTIONS = "MySubscriptions",
	SET_SOCKET_ID = "SetSocketId",
	SUBSCRIBE_TO_TICKER = "SubscribeToTicker",
	SUBSCRIBE_TO_TICKERS = "SubscribeToTickers",
	UNSUBSCRIBE_TO_TICKER = "UnsubscribeToTicker",
}

export type ClientMessage =
	| SetSocketIdClientMessage //
	| MySubscriptionsClientMessage
	| SubscribeToTickerClientMessage
	| SubscribeToTickersClientMessage
	| UnsubscribeToTickerClientMessage
	| SymbolTickerClientMessage;

export type SetSocketIdClientMessage = {
	//
	type: SocketClientMessageType.SET_SOCKET_ID;
	id: string;
};

export type MySubscriptionsClientMessage = {
	//
	type: SocketClientMessageType.MY_SUBSCRIPTIONS;
};

export type SubscribeToTickerClientMessage = {
	//
	type: SocketClientMessageType.SUBSCRIBE_TO_TICKER;
	ticker: string;
};

export type SubscribeToTickersClientMessage = {
	//
	type: SocketClientMessageType.SUBSCRIBE_TO_TICKERS;
	tickers: string[];
};

export type UnsubscribeToTickerClientMessage = {
	//
	type: SocketClientMessageType.UNSUBSCRIBE_TO_TICKER;
	ticker: string;
};

export type SymbolTickerClientMessage = {
	//
	type: SocketClientMessageType.SYMBOL_TICKER;
	symbol: string;
	last: number;
};
