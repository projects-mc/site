// A parsed line: time, level and (if any) source, or just the text
export type LogLine =
	| { time: string; level: string; source?: string; message: string }
	| { time?: undefined; level?: undefined; source?: undefined; message: string };

// "[23:24:23 INFO] [source] message" (madrone) or "[23:24:23 INFO]: [source] message" (Paper) -> parts; anything else
// (aspen's own lines, a stack trace) is kept as plain text
const linePattern = /^\[(\d\d:\d\d:\d\d) (\w+)\]:? (?:\[([^\]]+)\] )?(.*)$/;

export function parseLog(text: string): LogLine[] {
	return text
		.trimEnd()
		.split('\n')
		.map((line) => {
			const match = line.match(linePattern);
			if (!match) return { message: line };
			const [, time = '', level = '', source, message = ''] = match;
			return { time, level, source, message };
		});
}
