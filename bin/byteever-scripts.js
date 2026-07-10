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
	hasArgInCLI,
	hasProjectFile,
} = require( '@wordpress/scripts/utils' );

const { nodeArgs, scriptName, scriptArgs } = getNodeArgsFromCLI();

// Build commands run through the ByteEver webpack config unless the project provides one.
const WEBPACK_SCRIPTS = [ 'build', 'start' ];

if (
	WEBPACK_SCRIPTS.includes( scriptName ) &&
	! hasArgInCLI( '--config' ) &&
	! hasArgInCLI( '-c' ) &&
	! hasProjectFile( 'webpack.config.js' ) &&
	! hasProjectFile( 'webpack.config.babel.js' )
) {
	scriptArgs.push( '--config', require.resolve( '../config/webpack.config.js' ) );
}

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
		...scriptArgs,
	],
	{
		stdio: 'inherit',
	}
);
process.exit( status === null ? 1 : status );
