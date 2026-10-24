// The item at n (the first by default), failing the test if there's none
export function at<T>(items: readonly T[], n = 0): T {
	const item = items[n];
	if (item === undefined) throw new Error(`nothing at ${n} of ${items.length}`);
	return item;
}
