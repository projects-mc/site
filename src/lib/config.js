export const navItems = [
	{
		title: 'Console',
		route: '/console',
		// icon: 'console'
	},
	{
		title: 'Code',
		route: '/code',
		// icon: 'code'
	},
	{
		title: 'Backups',
		route: '/backups',
		// icon: 'github'
	},
	{
		title: 'Settings',
		route: '/settings',
		// icon: 'Settings',
		subitems: [
			{
				title: 'Instance options',
				route: 'options',
				image: 'instance.png'
			},
			{
				title: 'Development',
				route: 'dev',
				// image: 'development.png'
			},
			{
				title: 'Upgrade',
				route: 'upgrade',
				// image: 'placeholder.png'
			}
		]
	}
];
export const heroItems = [
	{
		project: 'Myst',
		description: 'A discontinued Roblox exploration game',
		images: [{ image: 'Myst.jpg' }]
	},
	{
		project: 'Permafrost',
		description: 'A custom Minecraft survival server',
		images: [
			{
				image: 'Permafrost2.png'
			}
		]
	},
	{
		project: 'Dueling',
		description: '1v1 tournament matchup Minecraft server',
		images: [
			{
				image: 'Dueling1.png',
				invertColors: true
			}
		]
	}
];
