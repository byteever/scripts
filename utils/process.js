/**
 * Get specific argument value from command line with enhanced parsing.
 *
 * @param {string} arg - Argument name to search for
 * @return {string|null} Argument value or null if not found
 * @example
 * getArgFromCLI('--mode') // 'development' (from --mode=development)
 * getArgFromCLI('--verbose') // null (from --verbose flag)
 */
const getArgFromCLI = ( arg ) => {
	const args = process.argv.slice( 2 );
	for ( const cliArg of args ) {
		const [ name, value ] = cliArg.split( '=' );
		if ( name === arg ) {
			return value || null;
		}
	}
	return undefined;
};

/**
 * Check if argument exists in command line.
 *
 * @param {string} arg - Argument name to check
 * @return {boolean} True if argument exists
 * @example
 * hasArgInCLI('--verbose') // true
 * hasArgInCLI('--missing') // false
 */
const hasArgInCLI = ( arg ) => getArgFromCLI( arg ) !== undefined;

module.exports = {
	getArgFromCLI,
	hasArgInCLI,
};
