import { CoinbinatorTicker } from "./types";

export enum SocketServerMessageType {
	SUBSCRIPTIONS = "Subscriptions",
	TICKERS = "Tickers",
}
export type SocketServerMessage = { type: SocketServerMessageType };

export type SubscriptionsServerMessage = SocketServerMessage & { type: SocketServerMessageType.SUBSCRIPTIONS; subscriptions: string[] };

export type TickersServerMessage = SocketServerMessage & { type: SocketServerMessageType.TICKERS; tickers: CoinbinatorTicker[] };
