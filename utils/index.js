/**
 * Internal dependencies
 */
const { getPackageProp } = require('./package');
const { getArgFromCLI, hasArgInCLI } = require('./process');
const { camelCaseDash } = require('./strings');
const { getConfig } = require('./config');

module.exports = {
	camelCaseDash,
	getConfig,
	getPackageProp,
	getArgFromCLI,
	hasArgInCLI,
};
