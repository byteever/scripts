/**
 * Internal dependencies
 */
const { getScriptArgs, hasWebpackConfig } = require( './config' );
const { SOURCE_DIR, OUTPUT_DIR } = require( './constants' );

module.exports = {
	getScriptArgs,
	hasWebpackConfig,
	SOURCE_DIR,
	OUTPUT_DIR,
};
