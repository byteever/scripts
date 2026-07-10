# @byteever/scripts

Zero-config [`@wordpress/scripts`](https://developer.wordpress.org/block-editor/reference-guides/packages/packages-scripts/) wrapper for ByteEver plugins.

## What it does

- `byteever-scripts` forwards every command to `wp-scripts`; `build` and `start` run through the ByteEver webpack config unless the project provides its own.
- Source at `assets/src/`, output at `assets/build/` — no flags, no config file.
- Copies block `block.json` and PHP files (`render.php`) into the build; emits async chunks to `chunks/`.
- Entries and externals are declared in `package.json` under the `byteever` key.
- Defaults the browserslist to `@wordpress/browserslist-config` when the project declares none.
- Replaces the `byteever` text domain with the plugin's own domain in vendor PHP (via node-wp-i18n), project JS, and `@byteever/*` packages.
- Extended dependency extraction for cross-plugin shared libraries.

## Setup

```json
{
	"scripts": {
		"start": "byteever-scripts start --experimental-modules --blocks-manifest",
		"build": "byteever-scripts build --experimental-modules --blocks-manifest",
		"lint:js": "byteever-scripts lint-js",
		"lint:css": "byteever-scripts lint-style",
		"format": "byteever-scripts format"
	},
	"byteever": {
		"entries": {
			"admin": "assets/src/admin/index.js",
			"frontend": "assets/src/frontend/index.js"
		}
	}
}
```

## Options

Under the `byteever` key in `package.json`:

- `entries` — entry points; a string path, or a webpack entry descriptor for producers exposing a shared library:

```json
{
	"byteever": {
		"entries": {
			"shared": {
				"import": "assets/src/shared/index.js",
				"library": { "name": [ "byteever", "shared" ], "type": "window" }
			}
		}
	}
}
```

- `externals` — scoped packages consumed from another plugin's shared library; handles are written into `.asset.php` as `{scope}-{name}`:

```json
{
	"byteever": {
		"externals": {
			"@byteever/shared": [ "byteever", "shared" ]
		}
	}
}
```

- `textdomain` — the target text domain; detected from `textDomain`, falling back to `name`, when not set.
- `updateDomains` — text domains to replace, or `true` for all; defaults to `[ "byteever" ]`:

```json
{
	"byteever": {
		"textdomain": "my-plugin",
		"updateDomains": [ "byteever", "old-domain" ]
	}
}
```

## Custom webpack config

Create a `webpack.config.js` and `byteever-scripts` defers to it. Extend the ByteEver config exactly like the `@wordpress/scripts` one:

```js
const baseConfig = require( '@byteever/scripts/config/webpack.config' );

module.exports = {
	...baseConfig,
	entry: {
		...baseConfig.entry,
		'js/admin': './assets/src/js/admin.js',
	},
};
```

With `--experimental-modules` the export is a `[ scripts, modules ]` array, matching `@wordpress/scripts`.

## Text domain

The target domain is detected from `textDomain`, falling back to `name`, normalized to a slug; override it with `byteever.textdomain`. The domains to replace default to `[ "byteever" ]`; override with `byteever.updateDomains` (or `true` for all). Vendor PHP is rewritten in place via node-wp-i18n.
