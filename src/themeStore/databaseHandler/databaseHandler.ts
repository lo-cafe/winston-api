import {ApprovalStates, MetadataColor, ThemeMetadata} from '../handleUploaded';
import * as Sequelize from "sequelize";
import {Model, Op} from "sequelize";

const sequelize = new Sequelize.Sequelize(
	"themes_database",
	"user",
	"password",
	{
		host: "localhost",
		dialect: "sqlite",
		logging: false,
		// SQLite only
		storage: "src/database/themes_database.sqlite",
	}
);

/**
 * Saves the theme metadata to the database.
 *
 * @param {ThemeMetadata} metadata - The metadata object for the theme.
 * @return {void}
 */
export async function saveOrUpdateTheme(metadata: ThemeMetadata): Promise<boolean> {
	let savableMetaData = {
		file_name: metadata.file_name,
		file_id: metadata.file_id,
		theme_name: metadata.theme_name,
		theme_author: metadata.theme_author,
		theme_description: metadata.theme_description,
		message_id: metadata.message_id,
		approval_state: metadata.approval_state,
		color: metadata.color.hex,
		alpha: metadata.color.alpha,
		icon: metadata.icon,
	} as SavableMetadata

	const tryTheme = await getThemeFromID(metadata.file_id)

	if (tryTheme != undefined){
		console.log("Theme already exists, updating")
		await updateThemeWithID(metadata.file_id, savableMetaData)
		return true
	} else {
		try {
			await ThemeTags.create(savableMetaData as any)
			await ThemeTags.sync()
			return true;
		} catch (error){
			console.error(error)
			return false
		}
	}


}

/**
 * Retrieves all themes from the database.
 *
 * @returns {Promise<Array<ThemeMetadata>>} - A promise that resolves to an array of theme metadata.
 */
export async function getAllThemes(fetchLimit: number, offset: number): Promise<Array<ThemeMetadata>> {
	let themesTags = await ThemeTags.findAll({
		where: { approval_state: "accepted"},
		limit: fetchLimit,
		offset: offset
	})
	let themes = []
	for (const theme of themesTags) {
		themes.push(<ThemeMetadata>themeFromTags(theme))
	}

	return themes
}

export async function getThemeByMessageID(messageID: string){
	let themeTag = await ThemeTags.findOne({where: {message_id: messageID}});
	return themeFromTags(themeTag)
}

/**
 * Retrieves the message ID associated with a theme ID.
 *
 * @param {string} id - The ID of the theme.
 * @returns {Promise<string>} The message ID associated with the theme ID.
 */
export async function getMessageIdByThemeID(id: string): Promise<string>{
	let themeTag = await ThemeTags.findOne({where: {file_id: id}});
	return themeTag?.get("message_id") as string
}

/**
 * Retrieves theme metadata from the database based on the provided ID.
 *
 * @param {string} id - The ID of the theme.
 * @return {Promise<ThemeMetadata | undefined>} - A Promise that resolves with the theme metadata
 * if found, or undefined otherwise.
 */
export async function getThemeFromID(id: string): Promise<ThemeMetadata | undefined> {
	let themeTag = await ThemeTags.findOne({where: {file_id: id}});
	return themeFromTags(themeTag)
}

/**
 * Retrieves themes metadata matching a given name.
 *
 * @param {string} name - The name to search for.
 * @returns {Promise<ThemeMetadata[]>} - A promise that resolves to an array of theme metadata objects.
 */
export async function getThemesFromName(name: string): Promise<ThemeMetadata[]> {
	let themesTags = await ThemeTags.findAll({
		where: { theme_name: { [Op.like]: '%' + name + '%' } }
	});
	let themes: ThemeMetadata[] = [];
	for (const theme of themesTags) {
		themes.push(<ThemeMetadata>themeFromTags(theme));
	}
	return themes;
}

/**
 * Deletes a theme with the specified ID from the database.
 *
 * @param {string} id - The ID of the theme to delete.
 * @param {string} messageID - The ID of the message to delete (optional).
 * @return {Promise<boolean>} - A Promise that resolves to true if the theme is successfully deleted, otherwise resolves to false.
 */
export async function deleteThemeWithID(id: string): Promise<boolean> {
	try {
		await ThemeTags.destroy({
			where: {
				file_id: id
			}
		});
		return true;
	} catch (error) {
		console.error(error);
		return false;
	}
}

/**
 * Updates the theme with the given ID using the provided update data.
 *
 * @param {string} id - The ID of the theme to update.
 * @param {Partial<SavableMetadata>} updateData - The data to update the theme with.
 * @return {Promise<boolean>} - A promise that resolves to `true` if the update was successful, and `false` otherwise.
 */
export async function updateThemeWithID(id: string, updateData: Partial<SavableMetadata>): Promise<boolean> {
	try {
		await ThemeTags.update(updateData, {
			where: {
				file_id: id
			}
		});
		return true;
	} catch (error) {
		console.error(error);
		return false;
	}
}

/**
 * Retrieves the approval state of the theme with the given ID.
 *
 * @param {string} id - The ID of the theme.
 * @return {Promise<ApprovalStates | undefined>} - A Promise that resolves to `ApprovalStates` if successful, and `undefined` otherwise.
 */
export async function getThemeStatus(id: string): Promise<ApprovalStates | undefined> {
	try {
		const theme = await getThemeFromID(id);
		return theme?.approval_state;
	} catch (error) {
		console.error(error);
	}
	return undefined
}

/**
 * Extracts metadata for a theme from a given tag.
 *
 * @param {Model<any, any> | null} tag - The tag to extract the metadata from.
 * @return {ThemeMetadata | undefined} The extracted theme metadata.
 */
function themeFromTags(tag: Model<any, any> | null): ThemeMetadata | undefined {
	if (!tag) return undefined;
	return {
		file_name: tag?.get("file_name") as string,
		file_id: tag?.get("file_id") as string,
		theme_name: tag?.get("theme_name") as string,
		theme_author: tag?.get("theme_author") as string,
		theme_description: tag?.get("theme_description") as string,
		approval_state: tag?.get("approval_state") as ApprovalStates,
		color: {
			hex: tag?.get("color") as string,
			alpha: tag?.get("alpha") as number,
		} as MetadataColor,
		icon: tag.get("icon") as string,
	} as ThemeMetadata
}

export interface SavableMetadata {
	file_name: string
	file_id: string
	theme_name: string
	theme_author: string
	theme_description: string
	message_id: string
	approval_state: ApprovalStates
	color: string
	alpha: number
	icon: string
}

export const ThemeTags = sequelize.define("themes", {
	//id have to be stored as string!
	file_name: {
		type: Sequelize.STRING,
		unique: false,
		allowNull: false,
	},
	file_id: {
		type: Sequelize.STRING,
		unique: true,
		allowNull: false,
	},
	theme_name: {
		type: Sequelize.STRING,
		allowNull: false,
	},
	theme_author: Sequelize.STRING,
	theme_description: Sequelize.TEXT,
	message_id: {
		type: Sequelize.STRING,
		allowNull: true,
		unique: true
	},
	approval_state: Sequelize.STRING,
	color: Sequelize.STRING,
	alpha: {
		type: Sequelize.FLOAT,
		defaultValue: 0,
		allowNull: false,
	},
	icon: Sequelize.STRING,
});