import unzipper from 'unzipper';
import fs from 'fs';
import {cacheFolder} from "../globals/constants";
import path from "path";
import * as util from "util";
import {getThemeFromID, saveOrUpdateTheme} from "./databaseHandler/databaseHandler";
import {WinstonThemePreview} from "./svgEditor";

/**
 * Handles uploaded file.
 *
 * @param {string} filename - The name of the uploaded file.
 * @returns {Promise<void>} - A promise that resolves once the file is handled.
 */
export const handleUploaded = async (filename: string): Promise<void> => {
	console.log(`Handling uploaded file: ${filename}`);
	let folderName = filename.replace(".zip", "")
	//get the file metadata
	const metadata = await extractThemeMetadata(filename, `${cacheFolder}/${folderName}`);
	if (!metadata) {return}

	//rename the zip file to be the same as the one in maybeTheme
	const maybeTheme = await getThemeFromID(metadata.file_id)
	if (maybeTheme != undefined){
		const oldFilePath = `${cacheFolder}/${filename}`
		const newFilePath = `${cacheFolder}/${maybeTheme.file_name}`
		fs.renameSync(oldFilePath, newFilePath)
		metadata.file_name = maybeTheme.file_name
		metadata.message_id = maybeTheme.message_id
	}

	await saveOrUpdateTheme(metadata)
	// if(maybeTheme){
	// 	await approveUpdate(metadata)
	// } else {
	// 	await initiateApproval(metadata)
	// }
}

/**
 * Extracts theme metadata from a zip file.
 * @param {string} filename - The name of the zip file.
 * @param {string} extractPath - The path where the zip file will be extracted.
 * @returns {Promise<ThemeMetadata | null>} A promise that resolves to the extracted theme metadata or null if an error occurs.
 */
async function extractThemeMetadata(filename: string, extractPath: string): Promise<ThemeMetadata | null> {
	let filePath = `${cacheFolder}/${filename}`
	let metadata = null;
	try {
		await new Promise((resolve, reject) => {
			fs.createReadStream(filePath)
				.pipe(unzipper.Extract({ path: extractPath }))
				.on('close', resolve)  // Change 'finish' to 'close'
				.on('error', reject);
		});

		console.log('File unzipped successfully');

		const jsonFilePath = path.join(extractPath,'theme.json');

		// Ensure theme.json file exists
		if (fs.existsSync(jsonFilePath)) {
			const readFile = util.promisify(fs.readFile);

			const data = await readFile(jsonFilePath, 'utf8');

			const jsonContent = JSON.parse(data);

			if (jsonContent && jsonContent.metadata) {
				//TODO: Make this cleaner
				metadata = {
					file_name: filename,
					file_id: jsonContent.id || '',
					theme_name: jsonContent.metadata.name || '',
					theme_author: jsonContent.metadata.author || '',
					theme_description: jsonContent.metadata.description || '',
					message_id: undefined,
					attachment_url: undefined,
					approval_state: ApprovalStates.PENDING,
					color: {
						alpha: jsonContent.metadata.color.alpha,
						hex: jsonContent.metadata.color.hex
					} as MetadataColor,
					icon: jsonContent.metadata.icon,
					themeColorsLight: {
						background: "#" + jsonContent.posts.bg.color._0.light.hex,
						accentColor: "#" + jsonContent.general.accentColor.light.hex,
						tabBarBackground: jsonContent.general.tabBarBG.blurry ? "#" + jsonContent.posts.bg.color._0.light.hex : "#" + jsonContent.general.tabBarBG.color.light.hex,
						subredditPillBackground: "#CCE4FF",
						divider: jsonContent.lists.dividersColors.light.hex,
						tabBarInactiveColor: "#A1A1A1",
						tabBarInactiveTextColor: "#ADAEAE",
						postTitleText:"#" + jsonContent.postLinks.theme.titleText.color.light.hex,
						postBodyText: "#" + jsonContent.postLinks.theme.bodyText.color.light.hex
					} as WinstonThemePreview,
					themeColorsDark: {
						background: "#" + jsonContent.posts.bg.color._0.dark.hex,
						accentColor: "#" + jsonContent.general.accentColor.dark.hex,
						tabBarBackground: jsonContent.general.tabBarBG.color.dark.hex.toUpperCase() == "FFFFFF" || jsonContent.general.tabBarBG.blurry ? "#" + jsonContent.posts.bg.color._0.dark.hex : "#" + jsonContent.general.tabBarBG.color.dark.hex,
						subredditPillBackground: "#CCE4FF",
						divider: jsonContent.lists.dividersColors.dark.hex,
						tabBarInactiveColor: "#A1A1A1",
						tabBarInactiveTextColor: "#ADAEAE",
						postTitleText:"#" + jsonContent.postLinks.theme.titleText.color.dark.hex,
						postBodyText: "#" + jsonContent.postLinks.theme.bodyText.color.dark.hex
					} as WinstonThemePreview
				} as ThemeMetadata;
			} else {
				console.error("Error parsing JSON");
			}
		} else {
			console.error("theme.json doesnt exist");
		}
	} catch (err) {
		console.error(`Error while unzipping file and reading JSON: ${err}`);
	} finally {
		// Delete the folder after finishing extracting the metadata
		fs.rm(extractPath, { recursive: true, force: true }, (err) => {
			if(err) {
				console.error(`Error while deleting folder: ${err}`);
			} else {
				console.log(`Folder deleted successfully: ${extractPath}`);
			}
		});
	}

	return metadata;
}


/**
 * Represents the metadata of a theme.
 */
export interface ThemeMetadata {
	file_name: string
	file_id: string
	theme_name: string
	theme_author: string
	theme_description: string
	message_id: string | undefined
	attachment_url: string | undefined
	thumbnails_urls: string[] | undefined
	approval_state: ApprovalStates
	color: MetadataColor
	icon: string
	themeColorsLight: WinstonThemePreview
	themeColorsDark: WinstonThemePreview
}

/**
 * Represents the color metadata.
 * @interface
 */
export interface MetadataColor {
	alpha: number
	hex: string
}

/**
 * Enum representing the possible states of an approval.
 * @enum {string}
 */
export enum ApprovalStates {
	PENDING = 'waiting for approval', // or whatever initial state
	ACCEPTED = 'accepted',
	DENIED = 'denied'
	// ... other states ...
}