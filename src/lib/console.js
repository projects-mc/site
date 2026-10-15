// "[23:24:23 INFO] [source] message" (madrone) or "[23:24:23 INFO]: [source] message" (Paper) -> parts; anything else
// (aspen's own lines, a stack trace) is kept as plain text
const linePattern = /^\[(\d\d:\d\d:\d\d) (\w+)\]:? (?:\[([^\]]+)\] )?(.*)$/;

export function parseLog(text) {
	return text.trimEnd().split('\n').map((line) => {
		const match = line.match(linePattern);
		return match ? { time: match[1], level: match[2], source: match[3], message: match[4] } : { message: line };
	});
}
