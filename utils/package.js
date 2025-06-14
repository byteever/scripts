/**
 * External dependencies
 */
const { realpathSync } = require( 'fs' );
const { readPackageUpSync } = require( 'read-package-up' );

/**
 * Internal dependencies
 */
const { getCurrentWorkingDirectory } = require( './process' );

const result = readPackageUpSync( {
	cwd: realpathSync( getCurrentWorkingDirectory() ),
} );

const getPackagePath = () => result?.path || null;

const getPackageProp = ( prop ) => result?.packageJson?.[ prop ];

const hasPackageProp = ( prop ) =>
	Object.prototype.hasOwnProperty.call( result?.packageJson || {}, prop );

module.exports = {
	getPackagePath,
	getPackageProp,
	hasPackageProp,
};
