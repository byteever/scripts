const fs = require( 'fs' );
const watch = require( 'node-watch' );
const { spawn } = require( 'child_process' );
const path = require( 'path' );
const chalk = require( 'chalk' );
const getPackages = require( '../packages/get-packages' );

const BUILD_SCRIPT = path.resolve( __dirname, './build-packages.js' );
const packages = getPackages();

if ( ! packages.length ) {
	console.error( 'No packages found to watch.' );
	console.log( 'Make sure your package has a "module" field in package.json.' );
	process.exit( 1 );
}

let filesToBuild = new Map();

function exists( filename ) {
	try {
		return fs.statSync( filename ).isFile();
	} catch ( e ) {}
	return false;
}

function isDirectory( pathname ) {
	try {
		return fs.statSync( pathname ).isDirectory();
	} catch ( e ) {}
	return false;
}

function isSourceFile( filename ) {
	const relativePath = path
		.relative( process.cwd(), filename )
		.replace( /\\/g, '/' );

	return (
		/\/src\/.+\.(js|json|scss|ts|tsx)$/.test( relativePath ) &&
		! [
			/\/(benchmark|__mocks__|__tests__|test|storybook|stories)\/.+/,
			/\.(spec|test)\.(js|ts|tsx)$/,
		].some( ( regex ) => regex.test( relativePath ) )
	);
}

function isModulePackage( filename ) {
	return packages.some( ( packagePath ) => {
		return filename.indexOf( packagePath ) > -1;
	} );
}

function isWatchableFile( filename, skip ) {
	if ( isDirectory( filename ) ) {
		return true;
	}

	return isSourceFile( filename ) && isModulePackage( filename )
		? true
		: skip;
}

function getBuildFile( srcFile ) {
	const srcDir = `${ path.sep }src${ path.sep }`;
	const packageDir = srcFile.substr( 0, srcFile.lastIndexOf( srcDir ) );
	const filePath = srcFile.substr( srcFile.lastIndexOf( srcDir ) + 5 );
	return path.resolve( packageDir, 'build', filePath );
}

function updateBuildFile( event, filename ) {
	if ( exists( filename ) ) {
		try {
			console.log( chalk.green( '->' ), `${ event }: ${ filename }` );
			filesToBuild.set( filename, true );
		} catch ( e ) {
			console.log(
				chalk.red( 'Error:' ),
				`Unable to update file: ${ filename } - `,
				e
			);
		}
	}
}

function removeBuildFile( event, filename ) {
	const buildFile = getBuildFile( filename );
	if ( exists( buildFile ) ) {
		try {
			fs.unlink( buildFile, () => {
				console.log( chalk.red( '<-' ), `${ event }: ${ filename }` );
			} );
		} catch ( e ) {
			console.log(
				chalk.red( 'Error:' ),
				`Unable to remove build file: ${ filename } - `,
				e
			);
		}
	}
}

packages.forEach( ( pkg ) => {
	const srcPath = path.resolve( pkg, 'src' );
	if ( fs.existsSync( srcPath ) ) {
		watch(
			srcPath,
			{ recursive: true, delay: 500, filter: isWatchableFile },
			( event, filename ) => {
				if (
					! isSourceFile( filename ) ||
					! isModulePackage( filename )
				) {
					return;
				}

				switch ( event ) {
					case 'update':
						updateBuildFile( event, filename );
						break;
					case 'remove':
						removeBuildFile( event, filename );
						break;
				}
			}
		);
	}
} );

setInterval( () => {
	const files = Array.from( filesToBuild.keys() );
	if ( files.length ) {
		filesToBuild = new Map();
		try {
			spawn( 'node', [ BUILD_SCRIPT, ...files ], { stdio: [ 0, 1, 2 ] } );
		} catch ( e ) {}
	}
}, 100 );

console.log( chalk.red( '->' ), chalk.cyan( 'Watching for changes...' ) );