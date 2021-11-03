import wu from "wu";
import { app } from "../../utils/helpers";
import { SocketServerMessageType, TickersServerMessage } from "../../utils/server_socket_messages";

/**
 * Dispatches dirty tickers to subscribers
 */
export default function app__dispatch_dirty_tickers_action() {
	app().clients_sockets.forEach((socket) => {
		const client_subscriptions = app().get_subscriptions_by_client(socket);

		const dirty_ticker_subscriptions = wu(app().tickers_dirty)
			.filter((ticker) => client_subscriptions?.has(ticker.id) === true)
			.toArray();

		app().socket_send_message(socket, {
			type: SocketServerMessageType.TICKERS,
			tickers: dirty_ticker_subscriptions,
		} as TickersServerMessage);
	});

	app().tickers_dirty.clear();
}
