/**
 * Default ESLint flat config for @byteever/scripts.
 *
 * Projects spread this from their eslint.config.js and declare their own
 * allowed text domain.
 */

/**
 * Internal dependencies
 */
const byteeverPlugin = require( '../tools/eslint' );

module.exports = [ ...byteeverPlugin.configs.recommended ];
