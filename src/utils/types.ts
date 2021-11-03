import * as WebSocket from "ws";
import app__dispatch_dirty_tickers_action from "../bootstrap/actions/app__dispatch_dirty_tickers_action";
import handle_client_message__my_subscriptions_action from "../bootstrap/actions/handle_client_message__my_subscriptions_action";
import MySubscriptionsAction from "../bootstrap/actions/handle_client_message__my_subscriptions_action";
import handle_client_message__subscribe_to_ticker_action from "../bootstrap/actions/handle_client_message__subscribe_to_ticker_action";
import SubscribeToTickerAction from "../bootstrap/actions/handle_client_message__subscribe_to_ticker_action";
import handle_client_message__unsubscribe_to_ticker_action from "../bootstrap/actions/handle_client_message__unsubscribe_to_ticker_action";
import UnsubscribeToTickerAction from "../bootstrap/actions/handle_client_message__unsubscribe_to_ticker_action";

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
	// subscriptions?: Set<string>;
};

export type ApplicationActions = {
	app__dispatch_dirty_tickers: typeof app__dispatch_dirty_tickers_action;
	handle_client_message__my_subscriptions: typeof handle_client_message__my_subscriptions_action;
	handle_client_message__subscribe_to_ticker: typeof handle_client_message__subscribe_to_ticker_action;
	handle_client_message__unsubscribe_to_ticker: typeof handle_client_message__unsubscribe_to_ticker_action;
};
