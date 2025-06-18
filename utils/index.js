/**
 * Internal dependencies
 */
const { getAssets, getPackages } = require( './entry' );
const { getPackageProp } = require( './package' );
const { camelCaseDash } = require( './strings' );
const { getConfig } = require( './config' );

module.exports = {
	camelCaseDash,
	getAssets,
	getConfig,
	getPackageProp,
	getPackages,
};
