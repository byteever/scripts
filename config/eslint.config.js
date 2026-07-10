/**
 * Default ESLint flat config for @byteever/scripts.
 *
 * Projects require this from their eslint.config.js; the allowed text
 * domain derives from the package name.
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
const { getPackageOption } = require( '../utils' );

const wpScriptsPath = path.dirname(
	require.resolve( '@wordpress/scripts/package.json' )
);
const wpPlugin = require( require.resolve( '@wordpress/eslint-plugin', {
	paths: [ wpScriptsPath ],
} ) );

const config = [
	// Global ignores.
	{
		ignores: [
			'**/assets/build/**',
			'**/build/**',
			'**/node_modules/**',
			'**/vendor/**',
		],
	},

	// Base recommended config from @wordpress/eslint-plugin.
	...wpPlugin.configs[ 'recommended-with-formatting' ],

	// Unit test overrides.
	...wpPlugin.configs[ 'test-unit' ].map( ( testConfig ) => ( {
		...testConfig,
		files: [ '**/@(test|__tests__)/**/*.js', '**/?(*.)test.js' ],
	} ) ),

	// ByteEver conventions.
	{
		languageOptions: {
			globals: {
				wp: 'readonly',
				ajaxurl: 'readonly',
				jQuery: 'readonly',
			},
		},
		rules: {
			'import/no-unresolved': 'off',
			'import/no-extraneous-dependencies': 'off',
			'no-console': 'off',
			'@wordpress/dependency-group': 'warn',
			'@wordpress/i18n-text-domain': [
				'error',
				{
					allowedTextDomain: getPackageOption(
						[ 'byteever.i18n.textdomain', 'name' ],
						''
					),
				},
			],
		},
	},
];

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
