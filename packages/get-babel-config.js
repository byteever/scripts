module.exports = ( environment = '', file ) => {
	const callerOpts = {
		caller: {
			name: `BYTEEVER_BUILD_${ environment.toUpperCase() }`,
		},
	};

	callerOpts.caller.addPolyfillComments = true;

	switch ( environment ) {
		case 'main':
			callerOpts.caller.modules = 'commonjs';
			break;
		case 'module':
			callerOpts.caller.modules = false;
			callerOpts.caller.useESModules = true;
			break;
		default:
			delete callerOpts.caller;
	}

	const sourceMapsOpts = {
		sourceMaps: true,
		sourceFileName: file,
	};

	return {
		...callerOpts,
		...sourceMapsOpts,
		presets: [ require.resolve( '@wordpress/babel-preset-default' ) ],
		babelrc: false,
		configFile: false,
	};
};
