/**
 * Internal dependencies
 */
const { globFiles } = require( './file' );

const { getArgFromCLI, hasArgInCLI } = require( './process' );
const { getPackageProp, hasPackageProp } = require( './package' );
const { camelCaseDash, formatNamespace, lowerCaseDash } = require( './strings' );
const { getConfig } = require( './webpack' );

module.exports = {
	globFiles,
	getArgFromCLI,
	hasArgInCLI,
	getPackageProp,
	hasPackageProp,
	camelCaseDash,
	lowerCaseDash,
	formatNamespace,
	getConfig,
};
