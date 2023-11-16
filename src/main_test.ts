import fs, {readdirSync} from "fs";
// Testing Framework

//Test creation guide
//create a new file in the tests folder
//create a new TestCase object named "test" and export it
//the test object has two properties, name and test
//name is a string that describes what the test does
//test is a function that returns a boolean or a Promise<boolean>
//run the test by running "npm run test" in the terminal

const testFolder = 'tests/';
const testAll = async () => {
	try {
		//same as commands but for events
		const eventFiles = readdirSync(testFolder).filter((file) =>
			file.endsWith(".ts")
		);
		console.log("Loaded " + eventFiles.length + ` test${eventFiles.length == 1 ? "" : "s"}\n`)

		for (const file of eventFiles) {
			// const event: Event = require(__dirname + `/events/${file}`).event;

			const test: TestCase = require(`../tests/${file}`).test as TestCase;
			const result = test.test()
			//check if result is a Promise
			if (result instanceof Promise) {
				const res = await result
				if (res){
					console.log(test.name + "......passed")
				} else {
					console.log(test.name + "......failed")
				}
			} else {
				console.log(result)
				if (result){
					console.log(test.name + "......passed")
				} else {
					console.log(test.name + "......failed")
				}
			}
		}
	} catch (err) {
		console.error("Critical error caught while testing " + err);
	}
}

testAll()

export interface TestCase {
	name: string;
	test: () => boolean | Promise<boolean>;
}
