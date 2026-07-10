/**
 * Default ESLint flat config for @byteever/scripts.
 *
 * Projects spread this from their eslint.config.js and declare their own
 * allowed text domain.
 */

/**
 * External dependencies
 */
const path = require( 'path' );

/**
 * WordPress dependencies
 */
const { hasBabelConfig } = require( '@wordpress/scripts/utils' );

/**
 * Internal dependencies
 */
const byteeverPlugin = require( '../tools/eslint' );

const wpScriptsPath = path.dirname(
	require.resolve( '@wordpress/scripts/package.json' )
);

const config = [ ...byteeverPlugin.configs.recommended ];

// If the project has no Babel config, provide defaults.
if ( ! hasBabelConfig() ) {
	config.push( {
		languageOptions: {
			parserOptions: {
				requireConfigFile: false,
				babelOptions: {
					presets: [
						require.resolve( '@wordpress/babel-preset-default', {
							paths: [ wpScriptsPath ],
						} ),
					],
				},
			},
		},
	} );
}

module.exports = config;
