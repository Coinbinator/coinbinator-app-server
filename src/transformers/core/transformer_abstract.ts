export default abstract class TransformerAbstract<IN, OUT> {
	abstract transform(data: IN): OUT;
}
