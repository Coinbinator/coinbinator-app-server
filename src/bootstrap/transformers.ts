import ItemResource from "@app/transformers/core/item_respurce";
import TickersServerMessageTransformer, { TickersServerMessageTransformerData } from "@app/transformers/tickers_server_message_transformer";
import { TickersServerMessage } from "@app/utils/server_socket_messages";


/**
 * Tickers Server Message Transformer
 */
export const tickers_server_message_resource = new ItemResource<TickersServerMessageTransformerData, TickersServerMessage>(new TickersServerMessageTransformer());
