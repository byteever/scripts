#!/usr/bin/env node

/**
 * External dependencies
 */
const { sync: spawn } = require( 'cross-spawn' );

/**
 * WordPress dependencies
 */
const {
	getArgsFromCLI,
	getPackageProp,
	hasArgInCLI,
	hasProjectFile,
} = require( '@wordpress/scripts/utils' );

const args = getArgsFromCLI();

// Build commands run through the ByteEver webpack config unless the project provides one.
const WEBPACK_SCRIPTS = [ 'build', 'start' ];

if (
	WEBPACK_SCRIPTS.includes( args[ 0 ] ) &&
	! hasArgInCLI( '--config' ) &&
	! hasProjectFile( 'webpack.config.js' )
) {
	args.push( '--config', require.resolve( '../config/webpack.config.js' ) );
}

// Default the browserslist to the WordPress config when the project has none.
if ( ! getPackageProp( 'browserslist' ) && ! hasProjectFile( '.browserslistrc' ) ) {
	process.env.BROWSERSLIST_CONFIG = require.resolve(
		'../config/.browserslistrc'
	);
}

const { status } = spawn(
	'node',
	[ require.resolve( '@wordpress/scripts/bin/wp-scripts.js' ), ...args ],
	{
		stdio: 'inherit',
	}
);
process.exit( status === null ? 1 : status );
