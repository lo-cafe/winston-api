import {cacheFolder} from "./constants";
import path from "path";
import fs from "fs";

/**
 * Clears the ./src/cache folder.
 */
export function clearCache() {
	const cacheFolderPath = path.join(__dirname, "../." + cacheFolder);

	fs.readdir(cacheFolderPath, (err, files) => {
		if (err) {
			return console.error(`Unable to read directory: ${err.message}`);
		}

		for (const file of files) {
			fs.unlink(path.join(cacheFolderPath, file), err => {
				if (err) {
					console.error(`Unable to delete file: ${err.message}`);
				}
			});
		}
	});
}