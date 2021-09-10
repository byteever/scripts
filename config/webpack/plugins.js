/**
 * External dependencies
 */
const CopyWebpackPlugin = require( 'copy-webpack-plugin' );
const ImageminPlugin = require( 'imagemin-webpack-plugin' ).default;
const ESLintPlugin = require( 'eslint-webpack-plugin' );
/**
 * WordPress dependencies
 */
const DependencyExtractionWebpackPlugin = require( '@wordpress/dependency-extraction-webpack-plugin' );
/**
 * External dependencies
 */
const MiniCSSExtractPlugin = require( 'mini-css-extract-plugin' );
const BrowserSyncPlugin = require( 'browser-sync-webpack-plugin' );
const { BundleAnalyzerPlugin } = require( 'webpack-bundle-analyzer' );
const StyleLintPlugin = require( 'stylelint-webpack-plugin' );
const WebpackRTLPlugin = require( 'webpack-rtl-plugin' );
const WebpackBar = require( 'webpackbar' );
const path = require( 'path' );
const RemoveEmptyScriptsPlugin = require( 'webpack-remove-empty-scripts' );
/**
 * Internal dependencies
 */
const CleanExtractedDeps = require( '../../utils/clean-extracted-deps' );

const {
	hasStylelintConfig,
	hasEslintConfig,
	fromConfigRoot,
	getArgFromCLI,
} = require( '../../utils' );

const removeDistFolder = ( file ) => {
	return file.replace( /(^\.\/dist\/)|^dist\//, '' );
};

module.exports = ( {
	isPackage,
	isProduction,
	projectConfig: { filenames, devURL, paths, wpDependencyExternals },
	packageConfig: { style },
} ) => {
	return [
		new ESLintPlugin( {
			failOnError: false,
			fix: true,
			...( ! hasEslintConfig() && {
				exclude: [ `/dist/`, `/node_modules/`, `/vendor/` ],
				overrideConfigFile: fromConfigRoot( '.eslintrc.js' ),
			} ),
		} ),

		// new WebpackRTLPlugin( {
		// 	filename: [ /(\.css)/i, '-rtl$1' ],
		// } ),

		// The WP_BUNDLE_ANALYZER global variable enables a utility that represents
		// bundle content as a convenient interactive zoomable treemap.
		process.env.WP_BUNDLE_ANALYZER && new BundleAnalyzerPlugin(),

		// MiniCSSExtractPlugin to extract the CSS thats gets imported into JavaScript.
		new MiniCSSExtractPlugin( {
			//esModule: false,
			filename: ( options ) => {
				if ( isPackage ) {
					return removeDistFolder( style );
				}

				return options.chunk.name.match( /-block$/ )
					? filenames.blockCSS
					: filenames.css;
			},
			chunkFilename: '[id].css',
		} ),

		! isPackage &&
			// Copy static assets to the `dist` folder.
			new CopyWebpackPlugin( {
				patterns: [
					{
						from: '**/*.{jpg,jpeg,png,gif,svg,eot,ttf,woff,woff2}',
						to: '[path][name].[ext]',
						noErrorOnMissing: true,
						context: path.resolve(
							process.cwd(),
							paths.copyAssetsDir
						),
					},
				],
			} ),

		// Compress images
		// Must happen after CopyWebpackPlugin
		new ImageminPlugin( {
			disable: ! isProduction,
			test: /\.(jpe?g|png|gif|svg)$/i,
		} ),

		! isProduction &&
			devURL &&
			new BrowserSyncPlugin(
				{
					host: 'localhost',
					port: getArgFromCLI( '--port' ) || 3000,
					proxy: devURL,
					open: false,
					files: [ '**/*.php', 'dist/**/*.css' ],
					ignore: [ 'dist/**/*.php' ],
				},
				{
					injectCss: true,
					reload: false,
				}
			),
		// Lint CSS.
		new StyleLintPlugin( {
			context: path.resolve( process.cwd(), paths.srcDir ),
			files: '**/*.(s(c|a)ss|css)',
			allowEmptyInput: true,
			...( ! hasStylelintConfig() && {
				configFile: fromConfigRoot( '.stylelintrc' ),
			} ),
		} ),
		// Fancy WebpackBar.
		new WebpackBar(),
		// DependencyExternals variable controls whether scripts' assets get
		// generated, and the default externals set.
		wpDependencyExternals &&
			! isPackage &&
			new DependencyExtractionWebpackPlugin( {
				injectPolyfill: true,
			} ),
		new CleanExtractedDeps(),
		new RemoveEmptyScriptsPlugin(),
	].filter( Boolean );
};
