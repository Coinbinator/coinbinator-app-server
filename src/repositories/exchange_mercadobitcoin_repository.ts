import Axios from "axios";
import Binance from "node-binance-api";
import { Event as WsEvent, MessageEvent as WsMessageEvent, WebSocket } from "ws";
import { Pair } from "../metas/pair";
import Pairs from "../metas/pairs";
import { app, loop, value } from "../utils/helpers";
import { CoinbinatorExchange, CoinbinatorTickerUpdate } from "../utils/types";

/**
 * Which pairs we should consider,
 * as the API dosen't support websockets and has a limited number of requests.
 */
const supported_pairs = [
	"AAVE/BRL",
	"BCH/BRL",
	"BTC/BRL",
	"ETH/BRL",
	"LTC/BRL",
	"SUSHI/BRL",
	"THFT/BRL",
	"UMA/BRL",
	"UNI/BRL",
	"USDC/BRL",
	"XRP/BRL",
	//
	// "ACMFT/BRL",
	// "ACORDO01/BRL",
	// "ALLFT/BRL",
	// "AMFT/BRL",
	// "ANKR/BRL",
	// "ARGFT/BRL",
	// "ASRFT/BRL",
	// "ATMFT/BRL",
	// "AXS/BRL",
	// "BAL/BRL",
	// "BAND/BRL",
	// "BARFT/BRL",
	// "BAT/BRL",
	// "BNT/BRL",
	// "CAIFT/BRL",
	// "CHZ/BRL",
	// "CITYFT/BRL",
	// "COMP/BRL",
	// "CRV/BRL",
	// "DAI/BRL",
	// "DAL/BRL",
	// "ENJ/BRL",
	// "GALFT/BRL",
	// "GRT/BRL",
	// "IMOB01/BRL",
	// "IMOB02/BRL",
	// "JUVFT/BRL",
	// "KNC/BRL",
	// "LINK/BRL",
	// "MANA/BRL",
	// "MATIC/BRL",
	// "MBCONS01/BRL",
	// "MBCONS02/BRL",
	// "MBFP01/BRL",
	// "MBFP02/BRL",
	// "MBFP03/BRL",
	// "MBFP04/BRL",
	// "MBFP05/BRL",
	// "MBPRK01/BRL",
	// "MBPRK02/BRL",
	// "MBPRK03/BRL",
	// "MBPRK04/BRL",
	// "MBPRK05/BRL",
	// "MBVASCO01/BRL",
	// "MCO2/BRL",
	// "MKR/BRL",
	// "NAVIFT/BRL",
	// "OGFT/BRL",
	// "OMG/BRL",
	// "PAXG/BRL",
	// "PFLFT/BRL",
	// "PSGFT/BRL",
	// "REI/BRL",
	// "REN/BRL",
	// "SAUBERFT/BRL",
	// "SCCPFT/BRL",
	// "SNX/BRL",
	// "THFT/BRL",
	// "UMA/BRL",
	// "UNI/BRL",
	// "WBTC/BRL",
	// "WBX/BRL",
	// "YFI/BRL",
	// "ZRX/BRL",
];

export class ExchangeMercadoBitcoinRepository {
	constructor() {}

	async init() {
		this.update_pair_prices();

		//NOTE: loop fixed interval to avoid api limits
		loop(60000 / (supported_pairs.length / 1000), this.update_pair_prices.bind(this));
	}

	async update_pair_prices() {
		const tickers = await Promise.all(
			supported_pairs.map((pair) => {
				const symbol = pair.split("/")[0];
				return this.tapi_ticker(symbol);
			})
		);

		for (const ticker of tickers) {
			if (ticker === void 0) continue;

			this.emit_ticker({
				exchange: CoinbinatorExchange.MERCADO_BITCOIN,
				pair: ticker.pair,
				price: ticker.last,
			});
		}
	}

	private emit_ticker(ticker: CoinbinatorTickerUpdate) {
		app().update_ticker(ticker);

		//TODO: emit computed USD tickers
	}

	private async tapi(uri: string): Promise<any> {
		uri = (uri || "").replace(/^\/+/, "");

		return Axios.get(`https://www.mercadobitcoin.net/api/${uri}`);
	}

	private async tapi_ticker(symbol: string): Promise<Tapi__Ticker> {
		return this.tapi(`/${symbol}/ticker/`)
			.then<Tapi__Ticker>((response) => ({
				pair: Pairs.get(symbol, "BRL", true),
				...(response?.data?.ticker || {}),
			}))
			.catch((x) => void 0) as Promise<Tapi__Ticker>;
	}
}

type Tapi__Ticker = {
	pair: Pair;
	high: string;
	low: string;
	vol: string;
	last: string;
	buy: string;
	sell: string;
	open: string;
	date: number;
};
