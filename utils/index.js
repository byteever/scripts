/**
 * Internal dependencies
 */
const {
	getPackageOption,
	getScriptArgs,
	hasWebpackConfig,
} = require( './config' );
const { SOURCE_DIR, OUTPUT_DIR } = require( './constants' );

module.exports = {
	getPackageOption,
	getScriptArgs,
	hasWebpackConfig,
	SOURCE_DIR,
	OUTPUT_DIR,
};
