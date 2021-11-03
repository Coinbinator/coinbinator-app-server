export enum SocketClientMessageType {
	MY_SUBSCRIPTIONS = "MySubscriptions",
	SET_SOCKET_ID = "SetSocketId",
	SYMBOL_TICKER = "SymbolTicker",
	SUBSCRIBE_TO_TICKER = "SubscribeToTicker",
	UNSUBSCRIBE_TO_TICKER = "UnsubscribeToTicker",
}
export type SocketClientMessage = { type: SocketClientMessageType };
export type SetSocketIdClientMessage = SocketClientMessage & { type: SocketClientMessageType.SET_SOCKET_ID; id: string };
export type MySubscriptionsClientMessage = SocketClientMessage & { type: SocketClientMessageType.MY_SUBSCRIPTIONS };
export type SubscribeToTickerClientMessage = SocketClientMessage & { type: SocketClientMessageType.SUBSCRIBE_TO_TICKER; ticker: string };
export type UnsubscribeToTickerClientMessage = SocketClientMessage & { type: SocketClientMessageType.UNSUBSCRIBE_TO_TICKER; ticker: string };
export type SymbolTickerClientMessage = SocketClientMessage & { type: SocketClientMessageType.SYMBOL_TICKER; symbol: string; last: number };
