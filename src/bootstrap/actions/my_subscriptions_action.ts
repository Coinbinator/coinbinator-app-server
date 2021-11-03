import { MySubscriptionsClientMessage } from "../../utils/client_socket_messages";
import { app } from "../../utils/helpers";
import { SocketServerMessageType, SubscriptionsServerMessage } from "../../utils/server_socket_messages";
import { CoinbinatorDecoratedWebSocket } from "../../utils/types";

export default class MySubscriptionsAction {
	execute(socket: CoinbinatorDecoratedWebSocket, message: MySubscriptionsClientMessage) {
		app().send_message(socket, {
			type: SocketServerMessageType.SUBSCRIPTIONS,
			subscriptions: Array.from(socket.subscriptions?.values() || []),
		} as SubscriptionsServerMessage);
	}
}
