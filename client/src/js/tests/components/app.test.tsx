import * as React from "react";
import * as Enzyme from "enzyme";
import * as Adapter from "enzyme-adapter-react-16";

import { App } from '../../components/app';

Enzyme.configure({ adapter: new Adapter() })

jest.mock("../../components/map", () => {
	return { Map : jest.fn(() => "") }
});
// jest.mock("../../lib/geocoder", () => {
// 	return {
// 		geocode : jest.fn((searchTerm) => {
// 			return new Promise((resolve, reject) => {
// 				if (searchTerm == 'Edinburgh') {
// 					resolve([{name: "Edinburgh, UK", gridReference: "NT27"}]);
// 				}
// 				else {
// 					reject("No places found");
// 				}
// 			});
// 		})
// 	}
// });

jest.useFakeTimers();

test('App component loads unenabled as expected', () => {

	let app = Enzyme.shallow(<App/>);
	expect(app.state().enabled).toEqual(true);

	app.instance().onInitError();
	expect(app.state().enabled).toEqual(false);
});

test('App component loads error as expected', () => {

	let app = Enzyme.shallow(<App/>);
	app.instance().onLoadError("No WebGL enabled");
	expect(app.state().errorMessage).toEqual("No WebGL enabled");

});

test('App component loads correctly as expected', () => {

	let app = Enzyme.shallow(<App/>);
	app.instance().updateMap({gridReference: "NT27"});
	expect(app.state().gridReference).toEqual("NT27");

});

	// Enter some text, expect autocomplete to display
	// input.simulate('change', { target: { value: "Edinburgh"} });
	// expect(app.state().searchTerm).toEqual("Edinburgh");
    // await jest.runOnlyPendingTimers();
	// expect(app.state().searchResults.length).toEqual(1);

	// // Click the button, expect state to be loading
	// button.simulate('click')
	// expect(app.state().loading).toEqual(true);

	// app.instance().loadDone();
	// expect(app.state().loading).toEqual(false);

// });

// test('App component returns an empty search correctly', async() => {

// 	let app = Enzyme.shallow(<App/>);
// 	let input = app.find('input');
// 	expect(app.state().searchTerm).toEqual("");

// 	// Enter some text, expect autocomplete to display
// 	input.simulate('change', { target: { value: "xxx"} });
// 	expect(app.state().searchTerm).toEqual("xxx");
//     await jest.runOnlyPendingTimers();
// 	expect(app.state().searchResults.length).toEqual(0);

// });

// 	let app = Enzyme.shallow(<App/>);

// 	let input = app.find('input');

// 	// input.simulate('keyup', { target: { value: "NT2" }, keyCode: 50 });
// 	// expect(app.state().loading).toEqual(false);

// 	// input.simulate('keyup', { target: { value: "NT2" }, keyCode: 13 });
// 	// expect(app.state().loading).toEqual(false);

// 	// input.simulate('keyup', { target: { value: "NT27" }, keyCode: 55 });
// 	// expect(app.state().loading).toEqual(false);

// 	// input.simulate('keyup', { target: { value: "NT27" }, keyCode: 13 });
// 	// expect(app.state().loading).toEqual(true);

// });

// test('App component handles load failure correctly', () => {

// 	let app = Enzyme.shallow(<App/>);

// 	// app.find('button').simulate('click')
// 	// expect(app.state().loading).toEqual(true);

// 	// app.instance().loadFailed("Sorry, failed");
// 	// expect(app.state().loading).toEqual(false);
// 	// expect(app.state().errorMessage).toEqual("Sorry, failed");

// });

// test('App component handles WebGL failure correctly', () => {

// 	let app = Enzyme.shallow(<App/>);
// 	expect(app.state().enabled).toEqual(true);

// 	app.instance().onInitError();
// 	expect(app.state().enabled).toEqual(false);

// });
