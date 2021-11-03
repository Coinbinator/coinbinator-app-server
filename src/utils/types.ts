import * as WebSocket from "ws";
import MySubscriptionsAction from "../bootstrap/actions/my_subscriptions_action";
import SubscribeToTickerAction from "../bootstrap/actions/subscribe_to_ticker_action";
import UnsubscribeToTickerAction from "../bootstrap/actions/unsubscribe_to_ticker_action";

export enum CoinbinatorExchange {
	GENERIC = "GENERIC",
	BINANCE = "BINANCE",
	GATEIO = "GATEIO",
	MERCADO_BITCOIN = "MERCADO_BITCOIN",
}

export type CoinbinatorTicker = {
	n?: number;
	id: string;
	exchange: CoinbinatorExchange;
	pair: string;
	price: string;
};

export type CoinbinatorDecoratedWebSocket = WebSocket & {
	session_id?: string;
	subscriptions?: Set<string>;
};

export type ApplicationActions = {
	my_subscriptions: MySubscriptionsAction;
	subscribe_to_ticker: SubscribeToTickerAction;
	unsubscribe_to_ticker: UnsubscribeToTickerAction;
};
