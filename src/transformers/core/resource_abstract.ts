import TransformerAbstract from "./transformer_abstract";

export default abstract class ResourceAbstract<R_IN, R_OUT, T_IN, T_OUT> {
	protected readonly transformer: TransformerAbstract<T_IN, T_OUT>;

	constructor(transformer: TransformerAbstract<T_IN, T_OUT>) {
		this.transformer = transformer;
	}

	abstract transform(data: R_IN): R_OUT;
}
