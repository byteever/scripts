#!/usr/bin/env node

/**
 * External dependencies
 */
const { sync: spawn } = require( 'cross-spawn' );

/**
 * WordPress dependencies
 */
const { getNodeArgsFromCLI } = require( '@wordpress/scripts/utils' );

/**
 * Internal dependencies
 */
const { getScriptArgs, resolveFromProjectRoot } = require( '../utils' );

const { nodeArgs, scriptName, scriptArgs } = getNodeArgsFromCLI();

const { status } = spawn(
	'node',
	[
		...nodeArgs,
		resolveFromProjectRoot( '@wordpress/scripts/bin/wp-scripts.js' ),
		...( scriptName
			? [ scriptName, ...getScriptArgs( scriptName, scriptArgs ) ]
			: [] ),
	],
	{
		stdio: 'inherit',
	},
);
process.exit( status === null ? 1 : status );
