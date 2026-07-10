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
const { getScriptArgs } = require( '../utils' );

const { nodeArgs, scriptName, scriptArgs } = getNodeArgsFromCLI();

// Default the browserslist to the WordPress config when the project has
// none, so autoprefixer matches the webpack target fallback.
if (
	! process.env.BROWSERSLIST_CONFIG &&
	! getPackageProp( 'browserslist' ) &&
	! hasProjectFile( '.browserslistrc' ) &&
	! hasProjectFile( 'browserslist' )
) {
	process.env.BROWSERSLIST_CONFIG = require.resolve(
		'@wordpress/scripts/config/.browserslistrc'
	);
}

const { status } = spawn(
	'node',
	[
		...nodeArgs,
		require.resolve( '@wordpress/scripts/bin/wp-scripts.js' ),
		...( scriptName
			? [ scriptName, ...getScriptArgs( scriptName, scriptArgs ) ]
			: [] ),
	],
	{
		stdio: 'inherit',
	}
);
process.exit( status === null ? 1 : status );
