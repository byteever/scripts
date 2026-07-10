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
		...getScriptArgs( scriptName, scriptArgs ),
	],
	{
		stdio: 'inherit',
	}
);
process.exit( status === null ? 1 : status );
