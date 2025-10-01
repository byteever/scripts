const { getArgFromCLI, hasArgInCLI } = require('./process');
const { getNodeArgsFromCLI, spawnScript } = require('./cli');

module.exports = {
	getArgFromCLI,
	hasArgInCLI,
	getNodeArgsFromCLI,
	spawnScript,
};
