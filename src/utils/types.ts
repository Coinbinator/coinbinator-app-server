import { countReset } from "console";
import * as WebSocket from "ws";

type SetSocketId = { type: "SetSocketId"; id: string };
type MySubscriptions = { type: "MySubscriptions" };
type SubscribeToSymbol = { type: "SubscribeToSymbol"; symbol: string };
type UnsubscribeToSymbol = { type: "UnsubscribeToSymbol"; symbol: string };
type SymbolTicker = { type: "SymbolTicker"; symbol: string; last: number };

export enum CoinbinatorExchange {
	GENERIC = "GENERIC",
	BINANCE = "BINANCE",
	MERCADO_BITCOIN = "MERCADO_BITCOIN",
}

export type CoinbinatorTicker = {
	n?:number;
	exchange: CoinbinatorExchange;
	pair: string;
	price: string;
};
