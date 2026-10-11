// "[23:24:23 INFO]: [source] message" -> parts; anything else (e.g. a plugin list continuation) is kept as plain text
const linePattern = /^\[(\d\d:\d\d:\d\d) (\w+)\]: (?:\[([^\]]+)\] )?(.*)$/;

export function parseLog(text) {
	return text.trimEnd().split('\n').map((line) => {
		const match = line.match(linePattern);
		return match ? { time: match[1], level: match[2], source: match[3], message: match[4] } : { message: line };
	});
}
