/**
 * External dependencies
 */
const path = require( 'path' );
const fs = require( 'fs' );

const PKG_PATH = path.resolve( process.cwd(), 'package.json' );

let packageJson;
try {
	packageJson = JSON.parse( fs.readFileSync( PKG_PATH, 'utf8' ) );
} catch {
	packageJson = {};
}

const getPackageProp = ( prop ) => packageJson?.[ prop ];

module.exports = {
	getPackageProp,
};