// Function to generate time based UUID
import { v4 as uuidv4 } from 'uuid';

/**
 * Generates a time-based UUID string.
 *
 * @returns {string} The generated UUID in the format "timestamp-uuid".
 */
export const generateTimeBasedUUID = (): string => {
	const timestamp = Date.now();
	const uuid = uuidv4();
	return `${timestamp}-${uuid}`;
}

import { promises as fs } from 'fs';

/**
 * Checks if a user is eligible based on the given token.
 *
 * @param {string} token - The user token to check eligibility for.
 * @return {Promise<boolean>} - A promise that resolves to a boolean indicating if the user is eligible.
 * @throws {Error} - Throws an error if there is an issue while checking eligibility.
 */
export async function getUserEligibility(token: string): Promise<boolean> {
	try {
		const data = await fs.readFile('./src/whitelist.json', 'utf-8');
		const json = JSON.parse(data);
		return json.users.includes(token);
	}
	catch (err) {
		console.error(`Error while checking user eligibility: ${err}`);
		return false;
	}
}

/**
 * Adds a user to the whitelist.
 *
 * @param {string} token - The token of the user to be added to the whitelist.
 * @returns {Promise<boolean>} A Promise that resolves to true if the user is added to the whitelist, false otherwise.
 */
export async function addUserToWhitelist(token: string): Promise<boolean> {
	try {
		const data = await fs.readFile('./src/whitelist.json', 'utf-8');
		const json = JSON.parse(data);
		if (!json.users.includes(token)) {
			json.users.push(token);
			await fs.writeFile('./src/whitelist.json', JSON.stringify(json));
			return true;
		}
		else {
			console.warn('User is already in the whitelist.');
			return false;
		}
	}
	catch (err) {
		console.error(`Error while adding user to whitelist: ${err}`);
		return false;
	}
}


/**
 * Checks if a user is in the whitelist.
 *
 * @param {string} token - The token of the user to check.
 * @return {Promise<boolean>} - A promise that resolves to true if the user is in the whitelist,
 *                              or false otherwise.
 */
export async function isUserInWhitelist(token: string): Promise<boolean> {
	try {
		const data = await fs.readFile('./src/whitelist.json', 'utf-8');
		const json = JSON.parse(data);
		return json.users.includes(token);
	}
	catch (err) {
		console.error(`Error while checking if user is in whitelist: ${err}`);
		return false;
	}
}

/**
 * Remove a user from the whitelist.
 * @param {string} token - The user token to be removed from the whitelist.
 * @returns {Promise<boolean>} - A promise that resolves to true if the user was successfully removed, otherwise false.
 */
export async function removeUserFromWhitelist(token: string): Promise<boolean> {
	try {
		const data = await fs.readFile('./src/whitelist.json', 'utf-8');
		const json = JSON.parse(data);
		const index = json.users.indexOf(token);
		if (index > -1) {
			json.users.splice(index, 1);
			await fs.writeFile('./src/whitelist.json', JSON.stringify(json));
			return true;
		} else {
			console.warn('User is not in the whitelist.');
			return false;
		}
	}
	catch (err) {
		console.error(`Error while removing user from whitelist: ${err}`);
		return false;
	}
}