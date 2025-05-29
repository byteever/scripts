/**
 * Internal dependencies
 */
const { globFiles } = require('./file');

const { getArgFromCLI, hasArgInCLI } = require('./process');

module.exports = {
	globFiles,
	getArgFromCLI,
	hasArgInCLI,
};
