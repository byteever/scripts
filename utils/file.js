const path = require('path');
const { glob } = require('glob');

/**
 * Try multiple glob patterns in order until a match is found.
 *
 * @param {string} sourcePath - Base directory to search within (e.g., 'resources')
 * @param {string[]} patterns - List of glob patterns relative to baseDir
 * @returns {string[]} Matched file paths
 */
const globFiles = (sourcePath, patterns) => {
	for (const pattern of patterns) {
		const matches = glob.sync(path.join(sourcePath, pattern));
		if (matches.length > 0) {
			return matches;
		}
	}

	return [];
};


module.exports = {
	globFiles,
};
