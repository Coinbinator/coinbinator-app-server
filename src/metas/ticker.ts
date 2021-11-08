import { CoinbinatorExchange } from "@app/utils/types";
import Pair from "./pair";

export default class CoinbinatorTicker {
	readonly id: string;
	readonly channel: string;
	readonly exchange: CoinbinatorExchange;
	readonly pair: Pair;
	price: string = "";

	constructor(exchange: CoinbinatorExchange, pair: Pair) {
		this.id = `${pair.key}@${exchange}`;
		this.channel = `TICKER:${pair.key}@${exchange}`;
		this.exchange = exchange;
		this.pair = pair;
	}
}
