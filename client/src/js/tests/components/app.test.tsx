import * as React from "react";
import * as Enzyme from "enzyme";
import * as Adapter from "enzyme-adapter-react-16";

import { App } from '../../components/app';

Enzyme.configure({ adapter: new Adapter() })

jest.mock("../../components/map", () => {
	return { Map : jest.fn(() => "") }
});

function fireEvent(target, eventType) {
	var evt = document.createEvent("Event");
	    evt.initEvent(eventType, false, true);
	    target.dispatchEvent(evt);
}

test('App component loads and searches correctly', () => {

	let app = Enzyme.shallow(<App/>);

	let input = app.find('input');

	expect(app.state().searchTerm).toEqual("");

	// Enter some text, expect button to become enabled
	// input.simulate('change', { target: { value: "NT27"} });
	// expect(app.state().searchTerm).toEqual("NT27");
	// expect(app.state().buttonEnabled).toEqual(true);

	// // Click the button, expect state to be loading
	// button.simulate('click')
	// expect(app.state().loading).toEqual(true);

	// app.instance().loadDone();
	// expect(app.state().loading).toEqual(false);

});

test('App component loads on keypresses', () => {

	let app = Enzyme.shallow(<App/>);

	let input = app.find('input');

	// input.simulate('keyup', { target: { value: "NT2" }, keyCode: 50 });
	// expect(app.state().loading).toEqual(false);

	// input.simulate('keyup', { target: { value: "NT2" }, keyCode: 13 });
	// expect(app.state().loading).toEqual(false);

	// input.simulate('keyup', { target: { value: "NT27" }, keyCode: 55 });
	// expect(app.state().loading).toEqual(false);

	// input.simulate('keyup', { target: { value: "NT27" }, keyCode: 13 });
	// expect(app.state().loading).toEqual(true);

});

test('App component handles load failure correctly', () => {

	let app = Enzyme.shallow(<App/>);

	// app.find('button').simulate('click')
	// expect(app.state().loading).toEqual(true);

	// app.instance().loadFailed("Sorry, failed");
	// expect(app.state().loading).toEqual(false);
	// expect(app.state().errorMessage).toEqual("Sorry, failed");

});

test('App component handles WebGL failure correctly', () => {

	let app = Enzyme.shallow(<App/>);
	expect(app.state().enabled).toEqual(true);

	app.instance().onInitError();
	expect(app.state().enabled).toEqual(false);

});
