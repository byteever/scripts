/**
 * External dependencies
 */
const path = require( 'path' );

/**
 * Internal dependencies
 */
const { getPackageProp } = require( './package' );

/**
 * Get configuration paths based on webpack context and environment variables.
 *
 * @param {string} context - Context path from webpack config (defaults to cwd)
 * @return {Object} Configuration object with paths and patterns
 */
const getConfig = ( context = process.cwd() ) => {
	const ROOT_PATH = process.cwd();
	const CONTEXT_PATH = context || ROOT_PATH;
	const RELATIVE_PATH = path.relative( ROOT_PATH, CONTEXT_PATH );
	const SOURCE_DIR = path.join( RELATIVE_PATH, process.env.WP_SOURCE_PATH || 'src' );
	const OUTPUT_DIR = path.join( RELATIVE_PATH, process.env.WP_OUTPUT_PATH || 'build' );
	const SOURCE_PATH = path.resolve( CONTEXT_PATH, process.env.WP_SOURCE_PATH || 'src' );
	const OUTPUT_PATH = path.resolve( CONTEXT_PATH, process.env.WP_OUTPUT_PATH || 'build' );

	return {
		PROJECT_NAME: getPackageProp( 'name' ),
		SOURCE_DIR,
		OUTPUT_DIR,
		SOURCE_PATH,
		OUTPUT_PATH,
	};
};

module.exports = { getConfig };
