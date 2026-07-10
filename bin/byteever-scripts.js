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

/**
 * Run a webpack command through the ByteEver config unless the project
 * provides its own.
 *
 * @param {string[]} args Script arguments.
 * @return {string[]} Arguments to forward.
 */
const useByteeverConfig = ( args ) => {
	if (
		hasArgInCLI( '--config' ) ||
		hasArgInCLI( '-c' ) ||
		hasProjectFile( 'webpack.config.js' ) ||
		hasProjectFile( 'webpack.config.babel.js' )
	) {
		return args;
	}

	return [
		...args,
		'--config',
		require.resolve( '../config/webpack.config.js' ),
	];
};

// Commands with customized arguments; everything else forwards verbatim.
const commands = {
	build: useByteeverConfig,
	start: useByteeverConfig,
};

const { nodeArgs, scriptName, scriptArgs } = getNodeArgsFromCLI();
const args = commands[ scriptName ]
	? commands[ scriptName ]( scriptArgs )
	: scriptArgs;

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
		...args,
	],
	{
		stdio: 'inherit',
	}
);
process.exit( status === null ? 1 : status );
