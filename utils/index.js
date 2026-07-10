/**
 * Internal dependencies
 */
const { SOURCE_DIR, OUTPUT_DIR } = require( './constants' );
const { getPackageProp } = require( './package' );

module.exports = {
	getPackageProp,
	SOURCE_DIR,
	OUTPUT_DIR,
};