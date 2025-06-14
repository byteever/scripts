/**
 * Given a string, returns a new string with dash separators converted to
 * camelCase equivalent. This is not as aggressive as `_.camelCase` in
 * converting to uppercase, where Lodash will also capitalize letters
 * following numbers.
 *
 * @param {string} string Input dash-delimited string.
 * @return {string} Camel-cased string.
 */
function camelCaseDash( string ) {
	return string.replace( /-([a-z])/g, ( _, letter ) => letter.toUpperCase() );
}

/**
 * Given a string, returns a new string with package namespace converted to
 * dash-separated lowercase format, removing @ and / characters.
 *
 * @param {string} string Input package string.
 * @return {string} Dash-separated lowercase string.
 */
function lowerCaseDash( string ) {
	return string.replace( /@([^/]+)\//g, '$1-' ).toLowerCase();
}

/**
 * Formats a string as a package namespace, ensuring it starts with '@'
 * and ends with '/' without duplicating these characters.
 *
 * @param {string} namespace Package namespace string.
 * @return {string} Formatted namespace.
 */
function formatNamespace( namespace ) {
	return ( namespace.startsWith( '@' ) ? '' : '@' ) + namespace + ( namespace.endsWith( '/' ) ? '' : '/' );
}

module.exports = {
	camelCaseDash,
	lowerCaseDash,
	formatNamespace,
};
