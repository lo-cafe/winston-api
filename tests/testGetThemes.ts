import {TestCase} from "../src/main_test";

export const test: TestCase = {
	name: "Get Themes",
	test: async () => {
		const endpoint = "/themes"
		const method = "GET"
		const headers = {
			"Content-Type": "application/json"
		}

		//call local endpoint
		try {
			const response = await fetch("http://localhost:3000" + endpoint, {
				method: method,
				headers: headers
			})
			//return true if response is 200
			//if response is not 200 return false and print error
			if (response.status != 200) {
				console.log("Error: " + response.status + " " + response.statusText)
				return false
			}
			return response.status == 200
		} catch (error) {
			console.log("Error: " + error)
			return false
		}
	}
}