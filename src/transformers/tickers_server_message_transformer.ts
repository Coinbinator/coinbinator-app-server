import wu from "wu";
import CoinbinatorTicker from "../metas/ticker";
import { ServerMessageType, TickersServerMessage } from "../utils/server_socket_messages";
import TransformerAbstract from "./core/transformer_abstract";

export default class TickersServerMessageTransformer extends TransformerAbstract<Iterable<CoinbinatorTicker>, TickersServerMessage> {
	transform(data: Iterable<CoinbinatorTicker>): TickersServerMessage {
		return {
			type: ServerMessageType.TICKERS,
			tickers: wu(data)
				.map((ticker) => ({
					exchange: ticker.exchange,
					pair: ticker.pair.key,
					price: ticker.price,
				}))
				.toArray(),
		};
	}
}
