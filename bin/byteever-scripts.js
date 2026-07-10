#!/usr/bin/env node

/**
 * External dependencies
 */
const { sync: spawn } = require( 'cross-spawn' );

/**
 * WordPress dependencies
 */
const {
	getNodeArgsFromCLI,
	getPackageProp,
	hasProjectFile,
} = require( '@wordpress/scripts/utils' );

/**
 * Internal dependencies
 */
const { hasWebpackConfig } = require( '../utils' );

const { nodeArgs, scriptName, scriptArgs } = getNodeArgsFromCLI();

// Default the browserslist to the WordPress config when the project has none.
if (
	! process.env.BROWSERSLIST_CONFIG &&
	! getPackageProp( 'browserslist' ) &&
	! hasProjectFile( '.browserslistrc' )
) {
	process.env.BROWSERSLIST_CONFIG = require.resolve(
		'../config/.browserslistrc'
	);
}

const { status } = spawn(
	'node',
	[
		...nodeArgs,
		require.resolve( '@wordpress/scripts/bin/wp-scripts.js' ),
		scriptName,
		// build and start run through the ByteEver config; everything else forwards verbatim.
		...( ! [ 'build', 'start' ].includes( scriptName ) ||
		hasWebpackConfig()
			? scriptArgs
			: [
					...scriptArgs,
					'--config',
					require.resolve( '../config/webpack.config.js' ),
			  ] ),
	],
	{
		stdio: 'inherit',
	}
);
process.exit( status === null ? 1 : status );
