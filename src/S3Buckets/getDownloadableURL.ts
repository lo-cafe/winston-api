import {GetObjectCommand} from "@aws-sdk/client-s3";
import {getSignedUrl} from "@aws-sdk/s3-request-presigner";
import {config} from 'dotenv';
import {s3Client} from "./bucketSetup";
import {getThemeFromID} from "../themeStore/databaseHandler/databaseHandler";

config();
const envConfig = process.env;

/**
 * Retrieves the download URL for a given filename.
 *
 * @param {string} filename - The name of the file to download.
 * @returns {Promise<string>} The download URL for the file.
 */
export async function getDownloadURL(filename: string): Promise<string> {
	const command = new GetObjectCommand({
		Bucket: envConfig.S3_BUCKET_NAME,
		Key: `themes/${filename}`,
	});

	return await getSignedUrl(s3Client, command, {expiresIn: 3600});
}

export async function getPreviewURLsFromS3(id: string){
	const theme = await getThemeFromID(id)
	if(!theme) {return []}
	const command = new GetObjectCommand({
		Bucket: envConfig.S3_BUCKET_NAME,
		Key: `images/dark/0-dark-${theme.file_id}.png`,
	});

	const command1 = new GetObjectCommand({
		Bucket: envConfig.S3_BUCKET_NAME,
		Key: `images/light/0-light-${theme.file_id}.png`,
	});

	const darkImage = await getSignedUrl(s3Client, command, {expiresIn: 3600});
	const lightImage = await getSignedUrl(s3Client, command1, {expiresIn: 3600});

	return [darkImage, lightImage]
}