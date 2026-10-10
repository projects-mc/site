// Load all Github repos from my personal account
export const load = async () => {
	try {
		const githubUserReposAPI = `https://api.github.com/users/amazinaxel/repos`;
		const repos = await fetch(githubUserReposAPI).then((response) => response.json());

		return { repos };
	} catch (e) {
		console.log('No connection to GitHub API');
		return { noConnection: true };
	}
};
