# @byteever/scripts

> ⚡ Minimal, opinionated Webpack config builder for WordPress plugin and theme development — powered by `@wordpress/scripts`.

---

### 🚀 Features

- ✅ Extends `@wordpress/scripts` with zero boilerplate
- ✅ Smart file discovery from the `resources/` directory
- ✅ Separate handling of admin, frontend, shared, and vendor files
- ✅ Auto-detection of client and source scripts
- ✅ Automatically compiles block files to PHP
- ✅ Copies fonts and images automatically
- ✅ Removes empty JS files generated from SCSS-only entries
- ✅ Streamlined progress output with `webpackbar`
- ✅ Trims unused timezone data from `moment-timezone`

---

### 📦 Installation

```bash
npm install @byteever/scripts --save-dev
npm install @wordpress/scripts --save-dev
```

---

### 🛠 Usage

In your plugin or theme root:

```js
// webpack.config.js
const baseConfig = require('@wordpress/scripts/config/webpack.config');
const createConfig = require('@byteever/scripts');

module.exports = createConfig(baseConfig);
```

---

### 🔍 Source Auto-Discovery (Default Behavior)

This package automatically scans the `resources/` directory to detect entry points for Webpack, following a clear priority-based pattern.

#### 🧩 For `scripts/` and `styles/` folders:

- If a folder (like `scripts/admin/` or `styles/frontend/`) contains a file named `index.js`, `index.jsx`, or `index.ts`, that file will be used as the entry point.
- If no `index` file is found, it will then look **one level deeper** inside that folder for any file that:
	- **Does not start with an underscore** (`_`)
	- Has one of these extensions: `.js`, `.jsx`, `.ts`, `.scss`, `.sass`, or `.css`

#### 🧩 For the `client/` folder:

- It checks each top-level subdirectory inside `client/` (such as `client/admin/`) for an `index.js`, `index.jsx`, or `index.ts` file.
- If not found, it looks deeper into nested directories within that client subfolder for the same kind of `index` files.

#### 🧩 For the `blocks/` folder:

- If a `blocks/` directory exists inside `resources/`, it will automatically compile all supported block files.
- The output will be saved as PHP files in the `assets/blocks/` directory.

> ✅ This provides seamless support for custom Gutenberg blocks.

---



---

### 📂 Manual Entry Support

You can optionally pass a second argument to `createConfig()` to **override or extend** the default auto-discovered entries.

#### 🧰 Option 1: Replace all entries with a custom object

```js
module.exports = createConfig(baseConfig, {
	'admin/settings': './custom/settings.js',
	'admin/styles': './custom/settings.scss',
});
```

This disables auto-discovery and will produce:

```
assets/scripts/admin-settings.js
assets/styles/admin-styles.css
```

#### 🧠 Format:

```js
{
  [outputName]: [sourceFilePath]
}
```

Example:

```js
{
  'client/frontend-dashboard': './client/frontend/dashboard/index.js',
  'scripts/admin-init': './scripts/admin/init.ts',
  'styles/frontend-main': './styles/frontend/main.scss',
}
```

#### 🧰 Option 2: Extend discovered entries using a callback

Instead of replacing entries, you can extend the default ones like this:

```js
module.exports = createConfig(baseConfig, (entries) => ({
  ...entries,
  'scripts/chartjs': './node_modules/chart.js/dist/Chart.js',
  'styles/jquery-ui': [
    './node_modules/jquery-ui/themes/base/theme.css',
    './node_modules/jquery-ui/themes/base/datepicker.css',
  ],
}));
```

This gives you full programmatic control to modify, filter, or merge the discovered entries before Webpack runs.

### 🧠 File Naming & Output Logic

#### ✅ `scripts/` and `styles/` directories

Handled smartly based on folder name:

- `scripts/admin/index.js` → `scripts/admin.js`
- `scripts/frontend/menu.js` → `scripts/frontend-menu.js`
- `styles/shared/forms.scss` → `styles/shared-forms.css`
- `styles/vendor/bootstrap.scss` → `styles/vendor-bootstrap.css`
- If a filename duplicates the folder name (`scripts/admin/admin.js`), it’s deduplicated automatically.

#### ✅ `client/` entries

- Output format: `client/admin-dashboard.js`, `client/frontend-settings.js`, etc.
- For nested files, the domain (`admin`, `frontend`) is always prepended automatically.
- Files under non-admin/frontend folders keep their full compound name (e.g. `client/shared-modal.js`)
- The `client/` folder is intended for **React-based applications**.

---

### 📁 Asset Copying (Built-in)

Automatically copies source assets to the correct output location:

| Source                  | Destination         |
|-------------------------|---------------------|
| `resources/images/*.svg` | `assets/images/`     |
| `resources/fonts/*.woff`| `assets/fonts/`      |

No config required.

---

### 🔌 Included Plugins

- [`webpackbar`](https://github.com/unjs/webpackbar) – Clean terminal output
- [`copy-webpack-plugin`](https://www.npmjs.com/package/copy-webpack-plugin) – Images & fonts
- [`webpack-remove-empty-scripts`](https://www.npmjs.com/package/webpack-remove-empty-scripts) – Prevent `.js` files from SCSS-only entries
- [`moment-timezone-data-webpack-plugin`](https://www.npmjs.com/package/moment-timezone-data-webpack-plugin) – Smaller moment builds

---

### 👤 Author

Built and maintained by [ByteEver](https://byteever.com)

