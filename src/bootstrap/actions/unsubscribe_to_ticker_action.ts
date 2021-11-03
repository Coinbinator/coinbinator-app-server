import { UnsubscribeToTickerClientMessage } from "../../utils/client_socket_messages";
import { norm_ticker_channel } from "../../utils/parsers";
import { CoinbinatorDecoratedWebSocket } from "../../utils/types";

export default class UnsubscribeToTickerAction {
	execute(socket: CoinbinatorDecoratedWebSocket, message: UnsubscribeToTickerClientMessage) {
		const ticker = norm_ticker_channel(message.ticker);

		if (typeof ticker === "undefined") return;

		socket.subscriptions?.delete(ticker);
	}
}
