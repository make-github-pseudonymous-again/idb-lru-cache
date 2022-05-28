export function assert(condition: boolean): asserts condition is true {
	if (!condition) {
		throw new Error();
	}
}
