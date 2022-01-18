module.exports = () => {
	return {
		// Copied from `'minimal'`.
		all: false,
		errors: true,
		modules: true,
		warnings: true,
		children: false,
		// Our additional options.
		assets: true,
		errorDetails: true,
		excludeAssets: /\.(jpe?g|png|gif|svg|woff|woff2)$/i,
		moduleTrace: true,
		performance: true,
	};
};
