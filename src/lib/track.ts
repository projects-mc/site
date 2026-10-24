// Reads values so the $effect it's called in reruns when they change, for effects that don't otherwise use them
export const track = (...values: unknown[]) => values.length;
