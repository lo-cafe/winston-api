import fs from 'fs-extra';
import sharp from "sharp";
import {ThemeMetadata} from "./handleUploaded";
export interface WinstonThemePreview {
	background: string;
	accentColor: string;
	tabBarBackground: string
	subredditPillBackground: string;
	divider: string;
	tabBarInactiveColor: string;
	tabBarInactiveTextColor: string;
	postBackground: string;
	postTitleText: string;
	postBodyText: string;
}

/**
 * Represents a color to replace object.
 * @interface
 */
interface ColorToReplace{
	[key: string]: {
		lightColor: string,
		darkColor: string
	}
}

/**
 * Converts an SVG file to PNG format.
 *
 * @param {string} filename - The path of the SVG file to convert.
 * @return {string} - The path of the converted PNG file.
 */
function convertToPNG(filename: string): string {
	sharp(filename)
		.png()
		.toFile(filename.replace(".svg", ".png"), (err) => {
			if (err) {
				console.error("Error during conversion to PNG ", err);
				return;
			}

			// The SVG to PNG conversion is successful at this point

			// Now let's delete the SVG file
			fs.rm(filename, (err) => {
				if (err) {
					console.error("Error deleting the SVG file", err);
				} else {
					console.log("SVG file deleted successfully");
				}
			});
		});
	console.log(filename)
	return filename.replace(".svg", ".png")
}

/**
 * Retrieves theme preview images based on the provided metadata.
 * Replaces specific colors in SVG template files with light and dark colors from metadata.
 * Converts the updated SVG files to PNG format.
 *
 * @param metadata - The theme metadata containing color values.
 * @returns An array of filenames of the generated preview images in PNG format.
 */
export function getThemePreviewImage(metadata: ThemeMetadata) {

	const colorsToReplace: ColorToReplace = {
		"#F2F2F7": {
			lightColor: metadata.themeColorsLight.background,
			darkColor: metadata.themeColorsDark.background
		},
		"#007AFF": {
			lightColor: metadata.themeColorsLight.accentColor,
			darkColor: metadata.themeColorsDark.accentColor
		},
		"#CCE4FF": {
			lightColor: metadata.themeColorsLight.subredditPillBackground,
			darkColor: metadata.themeColorsDark.subredditPillBackground
		},
		"#F2F2F2": {
			lightColor: metadata.themeColorsLight.divider,
			darkColor: metadata.themeColorsDark.divider
		},
		"#A1A1A1": {
			lightColor: metadata.themeColorsLight.tabBarInactiveColor,
			darkColor: metadata.themeColorsDark.tabBarInactiveColor
		},
		"#ADAEAE": {
			lightColor: metadata.themeColorsLight.tabBarInactiveTextColor,
			darkColor: metadata.themeColorsDark.tabBarInactiveTextColor
		},
		"#FFFFFE": {
			lightColor: metadata.themeColorsLight.postBackground,
			darkColor: metadata.themeColorsDark.postBackground
		},
		"#F7F7F8": {
			lightColor: metadata.themeColorsLight.tabBarBackground,
			darkColor: metadata.themeColorsDark.tabBarBackground
		},
		"#000001": {
			lightColor: metadata.themeColorsLight.postTitleText,
			darkColor:metadata.themeColorsDark.postTitleText
		},
		"#000002": {
			lightColor: metadata.themeColorsLight.postBodyText,
			darkColor: metadata.themeColorsDark.postBodyText
		},
		"#000003": {
			lightColor: "#000000",
			darkColor: "#FFFFFF"
		}
	}

	//max if two svg, because 2 * 2 (one dark and one light) = 4 which is the max you can see inside embeds
	let svgAssetsTemplates: string[] = ["winston.svg"]
	let counter = 0;
	let filenames: string[] = [];

	svgAssetsTemplates.forEach(file => {
		let svgData = fs.readFileSync('./src/assets/' + file, 'utf8');

		let svgDataDrk = svgData
		let svgDataLight = svgData

		for (let color in colorsToReplace) {
			let regex = new RegExp(color, 'g');
			svgDataDrk = svgDataDrk.replace(regex, colorsToReplace[color].darkColor);
			svgDataLight = svgDataLight.replace(regex, colorsToReplace[color].lightColor);
		}

		const lightFile = `./src/assets/${counter}-light-${metadata.file_id}.svg`
		const darkFile = `./src/assets/${counter}-dark-${metadata.file_id}.svg`
		fs.writeFileSync(lightFile, svgDataLight);
		fs.writeFileSync(darkFile, svgDataDrk);

		filenames.push(convertToPNG(lightFile));
		filenames.push(convertToPNG(darkFile));
		counter++
	})

	return filenames
}