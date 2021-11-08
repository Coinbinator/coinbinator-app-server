import CoinbinatorTicker from "../metas/ticker";
import ItemResource from "../transformers/core/item_respurce";
import TickersServerMessageTransformer, { TickersServerMessageTransformerData } from "../transformers/tickers_server_message_transformer";
import { TickersServerMessage } from "../utils/server_socket_messages";

/**
 * Tickers Server Message Transformer
 */
export const tickers_server_message_resource = new ItemResource<TickersServerMessageTransformerData, TickersServerMessage>(new TickersServerMessageTransformer());
