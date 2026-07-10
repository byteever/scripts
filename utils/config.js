/**
 * WordPress dependencies
 */
const { hasArgInCLI, hasProjectFile } = require( '@wordpress/scripts/utils' );

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

/**
 * Get the arguments to forward for the given command.
 *
 * @param {string}   script Script name.
 * @param {string[]} args   Script arguments.
 * @return {string[]} Arguments to forward.
 */
const getScriptArgs = ( script, args ) => {
	switch ( script ) {
		case 'build':
		case 'start':
			return hasWebpackConfig()
				? args
				: [
						...args,
						'--config',
						require.resolve( '../config/webpack.config.js' ),
				  ];
		default:
			return args;
	}
};

module.exports = {
	getScriptArgs,
	hasWebpackConfig,
};
