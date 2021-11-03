import wu from "wu";
import { MySubscriptionsClientMessage } from "../../utils/client_socket_messages";
import { app } from "../../utils/helpers";
import { SocketServerMessageType, SubscriptionsServerMessage } from "../../utils/server_socket_messages";
import { CoinbinatorDecoratedWebSocket } from "../../utils/types";

export default function handle_client_message__my_subscriptions_action(socket: CoinbinatorDecoratedWebSocket, message: MySubscriptionsClientMessage) {
	app().socket_send_message(socket, {
		type: SocketServerMessageType.SUBSCRIPTIONS,
		subscriptions: wu(app().get_subscriptions_by_client(socket) || []).toArray(),
	} as SubscriptionsServerMessage);
}
