const fs = require( 'fs' );
const path = require( 'path' );
const glob = require( 'fast-glob' );

function getWorkspaceRoot() {
	let currentDir = process.cwd();
	while ( currentDir !== path.parse( currentDir ).root ) {
		const packageJsonPath = path.resolve( currentDir, 'package.json' );
		if ( fs.existsSync( packageJsonPath ) ) {
			try {
				const packageJson = require( packageJsonPath );
				if ( packageJson.workspaces ) {
					return currentDir;
				}
			} catch ( e ) {}
		}
		currentDir = path.dirname( currentDir );
	}
	return process.cwd();
}

function resolveWorkspacePackages( workspaceRoot, workspacePatterns ) {
	const packages = [];

	for ( const pattern of workspacePatterns ) {
		const resolvedPattern = path.resolve( workspaceRoot, pattern );
		const matches = glob.sync( resolvedPattern, { onlyDirectories: true } );
		packages.push( ...matches );
	}

	return packages;
}

function isDirectory( filePath ) {
	try {
		return fs.lstatSync( filePath ).isDirectory();
	} catch ( e ) {
		return false;
	}
}

function hasModuleField( packagePath ) {
	try {
		const pkg = require( path.resolve( packagePath, 'package.json' ) );
		return !! pkg.module;
	} catch {
		return false;
	}
}

function getPackages() {
	const workspaceRoot = getWorkspaceRoot();
	const rootPackageJsonPath = path.resolve( workspaceRoot, 'package.json' );

	let rootPackageJson;
	try {
		rootPackageJson = require( rootPackageJsonPath );
	} catch ( e ) {
		console.error( 'Could not read package.json at root:', e );
		return [];
	}

	let packages = [];

	if ( rootPackageJson.workspaces ) {
		const workspacePatterns = Array.isArray( rootPackageJson.workspaces )
			? rootPackageJson.workspaces
			: rootPackageJson.workspaces.packages || [];

		const workspacePackages = resolveWorkspacePackages(
			workspaceRoot,
			workspacePatterns
		);

		packages = workspacePackages
			.filter( ( pkg ) => isDirectory( pkg ) && hasModuleField( pkg ) )
			.map( ( pkg ) => path.resolve( pkg ) );
	} else if ( hasModuleField( workspaceRoot ) ) {
		packages = [ workspaceRoot ];
	}

	if ( packages.length === 0 ) {
		console.warn( 'No packages found with "module" field in package.json' );
	}

	return packages;
}

module.exports = getPackages;
