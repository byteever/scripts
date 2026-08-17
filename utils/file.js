/**
 * External dependencies
 */
const path = require( 'path' );

/**
 * Resolve a request from the consumer project first, then this package.
 *
 * The wp-scripts peer dependency must resolve to the consumer's copy:
 * mixing this package's own dev copy with the consumer's copy loads two
 * physical webpack instances, and webpack rejects plugins created by a
 * different instance than the running compiler.
 *
 * @param {string} request Module request to resolve.
 * @return {string} Absolute path of the resolved module.
 */
const resolveFromProjectRoot = ( request ) =>
	require.resolve( request, {
		paths: [ process.cwd(), path.join( __dirname, '..' ) ],
	} );

module.exports = { resolveFromProjectRoot };
