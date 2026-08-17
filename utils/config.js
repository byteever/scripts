/**
 * WordPress dependencies
 */
const {
	getPackageProp,
	hasArgInCLI,
	hasProjectFile,
} = require( '@wordpress/scripts/utils' );

/**
 * Get the first defined package.json property from a list of property paths.
 *
 * @param {string|string[]} paths    Property paths in priority order.
 * @param {*}               fallback Value when no property is set.
 * @return {*} The first defined property value.
 */
const getPackageOption = ( paths, fallback ) => {
	for ( const propPath of [].concat( paths ) ) {
		const [ head, ...rest ] = propPath.split( '.' );
		const value = rest.reduce(
			( object, key ) => object?.[ key ],
			getPackageProp( head ),
		);

		if ( undefined !== value ) {
			return value;
		}
	}

	return fallback;
};

/**
 * Whether the project provides its own webpack config.
 *
 * Mirrors the unexported check in @wordpress/scripts, plus the -c alias.
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
	getPackageOption,
	getScriptArgs,
	hasWebpackConfig,
};
