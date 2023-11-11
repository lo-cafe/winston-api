import { PutObjectCommand} from "@aws-sdk/client-s3";
import { promises as fs } from "fs";
import { config } from 'dotenv';
config();
import {s3Client} from "./bucketSetup";

/**
 * Uploads a theme zip and multiple images to an S3 bucket.
 *
 * @param {string} themePath - The file path of the theme zip.
 * @param {string[]} lightImages - An array of file paths for the light images.
 * @param {string[]} darkImages - An array of file paths for the dark images.
 *
 * @return {Promise<void>} - A promise that resolves when all uploads are complete.
 *
 * @throws {Error} - If an error occurs during the upload process.
 */
export async function uploadToBucket(themePath: string, lightImages: string[], darkImages: string[]): Promise<void> {
	try {
		// Upload theme zip
		let themeData = await fs.readFile(themePath);
		let uploadParams = {
			Bucket: process.env.S3_BUCKET_NAME!,
			Body: themeData,
			Key: `themes/${themePath.split("/").pop()}` // Create unique Key. Assuming 'themePath' ends in file name
		};

		let themeUploadResponse = await s3Client.send(new PutObjectCommand(uploadParams));
		console.log("Theme upload successful: ", themeUploadResponse);

		// Upload light images
		for(let imagePath of lightImages) {
			console.log(lightImages)
			let imageData = await fs.readFile(imagePath);
			uploadParams = {
				Bucket: process.env.S3_BUCKET_NAME!,
				Body: imageData,
				Key: `images/light/${imagePath.split("/").pop()}` // Create unique Key. Assuming 'imagePath' ends in file name
			};

			let imageUploadRes = await s3Client.send(new PutObjectCommand(uploadParams));
			console.log("Light image upload successful: ", imageUploadRes);
		}

		// Upload dark images
		for(let imagePath of darkImages) {
			console.log(darkImages)
			let imageData = await fs.readFile(imagePath);
			uploadParams = {
				Bucket: process.env.S3_BUCKET_NAME!,
				Body: imageData,
				Key: `images/dark/${imagePath.split("/").pop()}` // Create unique Key. Assuming 'imagePath' ends in file name
			};

			let imageUploadRes = await s3Client.send(new PutObjectCommand(uploadParams));
			console.log("Dark image upload successful: ", imageUploadRes);
		}
	} catch (error) {
		console.error("An error occurred during the upload", error);
	}
}