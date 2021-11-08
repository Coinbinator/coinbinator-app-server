export enum SocketClientMessageType {
	MY_SUBSCRIPTIONS = "my_subscriptions",
	SET_SOCKET_ID = "set_socket_id",
	SUBSCRIBE_TO_TICKER = "subscribe_to_ticker",
	SUBSCRIBE_TO_TICKERS = "subscribe_to_tickers",
	UNSUBSCRIBE_TO_TICKER = "unsubscribe_to_ticker",
}

export type ClientMessage =
	| SetSocketIdClientMessage //
	| MySubscriptionsClientMessage
	| SubscribeToTickerClientMessage
	| SubscribeToTickersClientMessage
	| UnsubscribeToTickerClientMessage;

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
