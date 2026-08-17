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
	getNodeArgsFromCLI,
} = require( '@wordpress/scripts/utils' );

/**
 * Internal dependencies
 */
const { getScriptArgs, resolveFromProjectRoot } = require( '../utils' );

const { nodeArgs, scriptName, scriptArgs } = getNodeArgsFromCLI();

// An unknown command leaves `scriptName` undefined and `nodeArgs` holding the
// command itself, so forward raw argv and let wp-scripts report it.
const { status } = spawn(
	'node',
	[
		...( scriptName ? nodeArgs : [] ),
		resolveFromProjectRoot( '@wordpress/scripts/bin/wp-scripts.js' ),
		...( scriptName
			? [ scriptName, ...getScriptArgs( scriptName, scriptArgs ) ]
			: getArgsFromCLI() ),
	],
	{
		stdio: 'inherit',
	},
);
process.exit( status === null ? 1 : status );
