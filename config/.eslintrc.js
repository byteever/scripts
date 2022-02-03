/**
 * Internal dependencies
 */
const { hasBabelConfig } = require( '../utils' );

const eslintConfig = {
	root: true,
	extends: [ 'plugin:@wordpress/eslint-plugin/recommended' ],
	globals: {
		ajaxurl: true,
		document: true,
		jQuery: true,
		lodash: true,
		module: true,
		process: true,
		window: true,
		browser: true,
	},
	plugins: [ '@wordpress' ],
	settings: {
		'import/core-modules': [
			'@wordpress/block-editor',
			'@wordpress/components',
			'@wordpress/block-library',
			'@wordpress/editor',
			'@wordpress/element',
			'@wordpress/hooks',
			'@wordpress/html-entities',
			'@wordpress/icons',
			'@wordpress/blocks',
			'@wordpress/api-fetch',
			'@wordpress/dom-ready',
			'@wordpress/blob',
			'@wordpress/base-styles',
			'@wordpress/block-directory',
			'@wordpress/block-serialization-default-parser',
			'@wordpress/block-serialization-spec-parser',
			'@wordpress/compose',
			'@wordpress/core-data',
			'@wordpress/customize-widgets',
			'@wordpress/data-controls',
			'@wordpress/data',
			'@wordpress/date',
			'@wordpress/dom',
			'@wordpress/escape-html',
			'@wordpress/format-library',
			'@wordpress/i18n',
			'@wordpress/interface',
			'@wordpress/is-shallow-equal',
			'@wordpress/keycodes',
			'@wordpress/lazy-import',
			'@wordpress/list-reusable-blocks',
			'@wordpress/media-utils',
			'@wordpress/notices',
			'@wordpress/nux',
			'@wordpress/react-i18n',
			'@wordpress/priority-queue',
			'@wordpress/primitives',
			'@wordpress/react-native-aztec',
			'@wordpress/react-native-bridge',
			'@wordpress/redux-routine',
			'@wordpress/reusable-blocks',
			'@wordpress/rich-text',
			'@wordpress/server-side-render',
			'@wordpress/shortcod',
			'@wordpress/token-list',
			'@wordpress/url',
			'@wordpress/viewport',
			'@wordpress/warning',
			'@wordpress/wordcount',
			'@babel/plugin-proposal-class-properties',
		],
	},
	rules: {
		radix: 'error',
		yoda: [ 'error', 'never' ],
		'react/react-in-jsx-scope': 0,
		'react/prop-types': 0,
		'react/jsx-props-no-spreading': 0,
		'@wordpress/dependency-group': 1,
		'import/no-unresolved': [ 2, { ignore: [ '^@wordpress/' ] } ],
		'no-shadow': 0,
		camelcase: 0,
		'no-var': 0,
		'jsdoc/require-param': 'off',
		'no-console': 'off',
		'jsdoc/require-returns-description': 'off',
		'import/no-extraneous-dependencies': [
			'error',
			{
				devDependencies: true,
				optionalDependencies: true,
				peerDependencies: true,
			},
		],
	},
};

if ( ! hasBabelConfig() ) {
	eslintConfig.parserOptions = {
		requireConfigFile: false,
		babelOptions: {
			presets: [ require.resolve( '@wordpress/babel-preset-default' ) ],
		},
	};
}

module.exports = eslintConfig;
