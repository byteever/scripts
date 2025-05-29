const getAsBooleanFromENV = (name) => {
	const value = process.env[name];
	return !!value && value !== 'false' && value !== '0';
};

const getArgsFromCLI = (excludePrefixes) => {
	const args = process.argv.slice(2);
	if (excludePrefixes) {
		return args.filter((arg) => {
			return !excludePrefixes.some((prefix) => arg.startsWith(prefix));
		});
	}
	return args;
};

const getArgFromCLI = (arg) => {
	for (const cliArg of getArgsFromCLI()) {
		const [name, value] = cliArg.split('=');
		if (name === arg) {
			return value || null;
		}
	}
};

const hasArgInCLI = (arg) => getArgFromCLI(arg) !== undefined;

module.exports = {
	exit: process.exit,
	getAsBooleanFromENV,
	getArgsFromCLI,
	getArgFromCLI,
	hasArgInCLI,
	getCurrentWorkingDirectory: process.cwd,
};
