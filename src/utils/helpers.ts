import { App } from "@app/bootstrap/app";
import { v4 as uuidv4 } from "uuid";

let __app: App;
const __singletons: Map<any, any> = new Map();

export function uuid(): string {
	return uuidv4();
}

export function value(v: any) {
	if (typeof v === "function") {
		return v();
	}
	return v;
}

export function app(): App {
	return __app;
}

export function register_singleton<T>(identifier: any, value: T) {
	if (identifier === App) {
		__app = value as any as App;
	}
	__singletons.set(identifier, value);
	return value;
}

export function singleton<T>(identifier: any): T {
	return __singletons.get(identifier) as T;
}

export function wait(ms: number): Promise<void> {
	return new Promise((res) => setTimeout(res, ms));
}

export async function loop(ms: number, cb: () => unknown, heading: boolean = false) {
	if (heading) await cb();

	while (true) {
		await wait(ms);
		cb();
	}
}

export const coin_aliases = new Map<string, Set<string>>([
	//
	["USD", new Set(["USD", "USDT", "USDC", "TUSD", "SUSD", "BUSD"])],
]);

export function is_coin_alias(symbol: string | undefined, other: string | undefined): boolean {
	if (typeof symbol === "undefined") return false;
	if (typeof other === "undefined") return false;
	if (symbol === other) return true;

	return coin_aliases.get(symbol)?.has(other) === true;
}

export function is_coin_usd_alias(symbol: string | undefined): boolean {
	if (typeof symbol === "undefined") return false;
	if ("USD" === symbol) return true;

	return coin_aliases.get("USD")?.has(symbol) === true;
}

export function get_coin_aliases(coin: string): string[] {
	for (const [_, aliases] of coin_aliases) {
		if (aliases.has(coin)) return Array.from(aliases);
	}
	return [];
}

export function mapset_put_if_missing<T, U>(map: Map<T, Set<U>>, key: T, value: U) {
	if (!map.has(key)) map.set(key, new Set());

	const set = map.get(key);
	if (!set?.has(value)) set?.add(value);
}
