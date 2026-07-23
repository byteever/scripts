/**
 * Internal dependencies
 */
const {
	getPackageOption,
	getScriptArgs,
	hasWebpackConfig,
} = require( './config' );
const { SOURCE_DIR, OUTPUT_DIR } = require( './constants' );
const { resolveFromProjectRoot } = require( './file' );

module.exports = {
	getPackageOption,
	getScriptArgs,
	hasWebpackConfig,
	resolveFromProjectRoot,
	SOURCE_DIR,
	OUTPUT_DIR,
};
