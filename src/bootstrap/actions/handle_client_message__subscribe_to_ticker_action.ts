import { SubscribeToTickerClientMessage } from "../../utils/client_socket_messages";
import { app } from "../../utils/helpers";
import { norm_ticker_channel } from "../../utils/parsers_and_normalizers";
import { CoinbinatorDecoratedWebSocket } from "../../utils/types";

export default function handle_client_message__subscribe_to_ticker_action(socket: CoinbinatorDecoratedWebSocket, message: SubscribeToTickerClientMessage) {
	const ticker = norm_ticker_channel(message.ticker);

	if (typeof ticker === "undefined") return;

	app().get_subscriptions_by_channel(ticker, true)?.add(socket);
	app().get_subscriptions_by_client(socket)?.add(ticker);
}
