import ResourceAbstract from "./resource_abstract";

export default class ItemResource<IN, OUT> extends ResourceAbstract<IN, OUT, IN, OUT> {
	transform(data: IN): OUT {
		const result = this.transformer.transform(data);
		return result;
	}
}
