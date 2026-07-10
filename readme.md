# @byteever/scripts

Zero-config [`@wordpress/scripts`](https://developer.wordpress.org/block-editor/reference-guides/packages/packages-scripts/) wrapper for ByteEver plugins.

## What it does

- Source at `assets/src/`, output at `assets/build/` — no flags, no config.
- Copies block `block.json` and PHP files (`render.php`) into the build.
- Always exports an array — `[ scripts ]`, or `[ scripts, modules ]` with `--experimental-modules` — so extending never branches on shape.
- Entries are declared explicitly in `package.json` under `byteever.entries`; block entries come from `block.json`.
- Emits async chunks to `chunks/`.
- Replaces the `byteever` text domain with the plugin's own domain in vendor PHP, project JS, and `@byteever/*` packages.
- Extended dependency extraction for cross-plugin shared libraries.

## Setup

`webpack.config.js`:

```js
module.exports = require( '@byteever/scripts/config/webpack.config' );
```

Extending:

```js
const configs = require( '@byteever/scripts/config/webpack.config' );

module.exports = configs.map( ( config ) => ( { ...config } ) );
```

`package.json`:

```json
{
	"scripts": {
		"start": "wp-scripts start --experimental-modules --blocks-manifest",
		"build": "wp-scripts build --experimental-modules --blocks-manifest"
	}
}
```

## package.json options

Under a `byteever` key:

```json
{
	"byteever": {
		"entries": {
			"gateway": "assets/src/payments/gateway.js",
			"shared": {
				"import": "assets/src/shared/index.js",
				"library": { "name": [ "byteever", "shared" ], "type": "window" }
			}
		},
		"externals": {
			"@byteever/shared": [ "byteever", "shared" ]
		}
	}
}
```

- `entries` — extra entry points; a string path, or a webpack entry descriptor for producers exposing a shared library.
- `externals` — scoped packages consumed from another plugin's shared library; handles are written into `.asset.php` as `{scope}-{name}`.

The text domain is detected from `textDomain`, falling back to `name`.
