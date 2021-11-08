import { assert_valid_symbol_string } from "@app/utils/parsers_and_normalizers";

export default class Pair {
	readonly key!: string;
	readonly idn: string;
	readonly base!: string;
	readonly quote!: string;

	constructor(base: string, quote: string) {
		assert_valid_symbol_string(base);
		assert_valid_symbol_string(quote);

		this.base = base;
		this.quote = quote;

		this.idn = [base, quote].sort().join("/");
		this.key = `${this.base}/${this.quote}`;
	}

	toString() {
		return this.key;
	}
}
