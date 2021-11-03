import { SocketClientMessageType, SubscribeToTickerClientMessage } from "../../utils/client_socket_messages";
import { app } from "../../utils/helpers";
import { norm_ticker_channel } from "../../utils/parsers";
import { SocketServerMessageType, SubscriptionsServerMessage } from "../../utils/server_socket_messages";
import { CoinbinatorDecoratedWebSocket } from "../../utils/types";

export default class SubscribeToTickerAction {
	execute(socket: CoinbinatorDecoratedWebSocket, message: SubscribeToTickerClientMessage) {
		const ticker = norm_ticker_channel(message.ticker);

		if (typeof ticker === "undefined") return;

		socket.subscriptions?.add(ticker);

		app().actions.my_subscriptions.execute(socket, { type: SocketClientMessageType.MY_SUBSCRIPTIONS });
	}
}
