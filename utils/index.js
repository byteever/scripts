/**
 * Internal dependencies
 */
const {
	getPackageOption,
	getScriptArgs,
	hasWebpackConfig,
} = require( './config' );
const { resolveFromProjectRoot } = require( './file' );

module.exports = {
	getPackageOption,
	getScriptArgs,
	hasWebpackConfig,
	resolveFromProjectRoot,
};
