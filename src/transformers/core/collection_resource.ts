import wu from "wu";
import ResourceAbstract from "./resource_abstract";

export default class CollectionResource<IN, OUT> extends ResourceAbstract<Iterable<IN>, Iterable<OUT>, IN, OUT> {
	transform(data: Iterable<IN>): Iterable<OUT> {
		return wu(data)
			.map((item) => this.transformer.transform(item))
			.toArray();
	}
}
