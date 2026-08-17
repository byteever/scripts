/**
 * ByteEver ESLint plugin.
 *
 * Custom rules live in `rules`; `configs.recommended` is consumed through
 * config/eslint.config.js.
 */

/**
 * External dependencies
 */
const path = require( 'path' );

/**
 * Internal dependencies
 */
const { version } = require( '../../package.json' );

const wpScriptsPath = path.dirname(
	require.resolve( '@wordpress/scripts/package.json' ),
);
const wpPlugin = require( require.resolve( '@wordpress/eslint-plugin', {
	paths: [ wpScriptsPath ],
} ) );

const plugin = {
	meta: {
		name: '@byteever/eslint-plugin',
		version,
	},
	rules: {},
	configs: {},
};

const recommended = [
	// Global ignores.
	{
		ignores: [
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
		plugins: {
			byteever: plugin,
		},
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
		},
	},
];

Object.assign( plugin.configs, {
	recommended,
} );

module.exports = plugin;
