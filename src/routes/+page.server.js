import { XMLParser } from 'fast-xml-parser';
import { projects } from '#lib/config';
// Load all of the posts from the journal
export const load = async () => {
	try {
		// Get Journal posts
		const journal_feed_url = `https://journal.amazinaxel.com/rss.xml`;
		const journalPosts = await fetch(journal_feed_url)
			.then((response) => response.text())
			.then((rawXml) => new XMLParser().parse(rawXml).rss.channel.item);

		// Get major and minor projects & remap items
		const projectItems = projects.major.concat(projects.other).map((item) => ({ ...item }));

		// Get Github repos
		const repo_url = `https://api.github.com/users/amazinaxel/repos`;
		const githubRepos = await fetch(repo_url).then((response) => response.json());

		// Return data
		return { journalPosts, projectItems, githubRepos };
	} catch (e) {
		console.log('No connection to external server!');
		return {
			journalPosts: {},
			projectItems: {},
			githubRepos: {}
		};
	}
};
