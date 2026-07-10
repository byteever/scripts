/**
 * Default ESLint config for @byteever/scripts.
 *
 * Projects extend this from their .eslintrc.js and declare their own
 * allowed text domain; byteever-scripts enables the eslintrc format.
 */
module.exports = {
	extends: [ 'plugin:@wordpress/eslint-plugin/recommended-with-formatting' ],
	ignorePatterns: [
		'**/assets/build/**',
		'**/build/**',
		'**/node_modules/**',
		'**/vendor/**',
	],
	env: {
		browser: true,
		es6: true,
	},
	globals: {
		wp: 'readonly',
		ajaxurl: 'readonly',
		jQuery: 'readonly',
	},
	rules: {
		'import/no-unresolved': 'off',
		'import/no-extraneous-dependencies': 'off',
		'no-console': 'off',
		'@wordpress/dependency-group': 'warn',
	},
	overrides: [
		{
			files: [ '**/@(test|__tests__)/**/*.js', '**/?(*.)test.js' ],
			env: {
				jest: true,
			},
		},
	],
};
