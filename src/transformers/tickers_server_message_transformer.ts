import wu from "wu";
import CoinbinatorTicker from "../metas/ticker";
import { ServerMessageType, TickersServerMessage, TickersServerMessage_Ticker } from "../utils/server_socket_messages";
import TransformerAbstract from "./core/transformer_abstract";

export type TickersServerMessageTransformerData = {
	tickers: CoinbinatorTicker[];
	computed_tickers: CoinbinatorTicker[];
};

export default class TickersServerMessageTransformer extends TransformerAbstract<TickersServerMessageTransformerData, TickersServerMessage> {
	transform(data: TickersServerMessageTransformerData): TickersServerMessage {
		return {
			type: ServerMessageType.TICKERS,
			tickers: wu(data.tickers)
				.map((ticker) => this.map_prepare_ticker(ticker))
				.toArray(),
			tickers_computed: wu(data.computed_tickers)
				.map((ticker) => this.map_prepare_ticker(ticker))
				.toArray(),
		};
	}

	private map_prepare_ticker(ticker: CoinbinatorTicker): TickersServerMessage_Ticker {
		return {
			exchange: ticker.exchange,
			pair: ticker.pair.key,
			price: ticker.price,
		};
	}
}
