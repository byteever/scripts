/**
 * WordPress dependencies
 */
const { hasArgInCLI, hasProjectFile } = require( '@wordpress/scripts/utils' );

/**
 * Internal dependencies
 */
const { SOURCE_DIR, OUTPUT_DIR } = require( './constants' );

/**
 * Whether the project provides its own webpack config.
 *
 * @return {boolean} Whether a project webpack config exists.
 */
const hasWebpackConfig = () =>
	hasArgInCLI( '--config' ) ||
	hasArgInCLI( '-c' ) ||
	hasProjectFile( 'webpack.config.js' ) ||
	hasProjectFile( 'webpack.config.babel.js' );

module.exports = {
	hasWebpackConfig,
	SOURCE_DIR,
	OUTPUT_DIR,
};
