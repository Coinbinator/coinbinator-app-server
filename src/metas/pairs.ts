import assert from "assert";
import { MissingPairError } from "../utils/errors";
import { assert_valid_pair_string, assert_valid_symbol_string, split_pair } from "../utils/parsers_and_normalizers";
import Pair from "./pair";

export default abstract class Pairs {
	private static pairs: Map<string, Pair> = new Map();

	static all() {
		return Pairs.pairs;
	}

	static get(base: string, quote: string, register_if_missing: boolean = false): Pair {
		assert_valid_symbol_string(base);
		assert_valid_symbol_string(quote);

		const key = `${base}/${quote}`;

		if (Pairs.pairs.has(key)) {
			return Pairs.pairs.get(key) as Pair;
		}

		if (register_if_missing === true) {
			const pair = new Pair(base, quote);
			Pairs.pairs.set(key, pair);

			return pair;
		}

		throw new MissingPairError();
	}

	static get2(pair: string, register_if_missing: boolean = false): Pair {
		const { base, quote } = split_pair(pair);
		return Pairs.get(base, quote, register_if_missing);
	}
}
