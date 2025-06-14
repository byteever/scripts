const eslintConfig = {
	root: true,
	extends: [ 'plugin:@wordpress/eslint-plugin/recommended-with-formatting' ],
	plugins: [ 'import' ],
	env: {
		browser: true,
		es6: true,
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
		'jsdoc/require-param': 'off',
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

module.exports = eslintConfig;

