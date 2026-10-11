// Placeholder instances until the backend exists
export const instances = [
	{
		name: 'Survival',
		running: true,
		updateAvailable: true,
		players: 3,
		memory: 42,
		backups: [
			{ name: 'Automatic backup', time: '2026-05-04T06:00:00Z', size: '1.4 GB' },
			{ name: 'Update 26.3-142 backup', time: '2026-05-03T21:47:12Z', size: '1.4 GB' },
			{ name: 'Manual backup', time: '2026-05-02T18:31:40Z', size: '1.3 GB' },
			{ name: 'Automatic backup', time: '2026-04-26T06:00:00Z', size: '1.1 GB' }
		],
		logs: [
			{ start: '2026-05-04T06:24:23Z', end: null },
			{ age: '12 hr ago', start: '2026-05-03T05:10:02Z', end: '2026-05-04T06:24:20Z' },
			{ age: '1 day ago', start: '2026-05-02T04:58:41Z', end: '2026-05-03T05:09:58Z' },
			{ age: '2 days ago', start: '2026-05-01T03:12:09Z', end: '2026-05-02T04:58:37Z' }
		]
	},
	{
		name: 'Creative',
		running: false,
		updateAvailable: false,
		players: 0,
		memory: 0,
		backups: [
			{ name: 'Manual backup', time: '2026-05-01T16:05:09Z', size: '620 MB' }
		],
		logs: [
			{ start: '2026-05-04T18:02:11Z', end: null },
			{ age: '3 days ago', start: '2026-04-30T16:40:00Z', end: '2026-05-01T22:15:31Z' }
		]
	}
];
