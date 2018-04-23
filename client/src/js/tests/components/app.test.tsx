import * as React from "react";
import * as Enzyme from "enzyme";
import * as Adapter from "enzyme-adapter-react-16";

import { App } from '../../components/app';

Enzyme.configure({ adapter: new Adapter() })

jest.mock("../../components/map", () => {
	return { Map : jest.fn(() => "") }
});

jest.useFakeTimers();

test('App component renders unenabled as expected', () => {

	let app = Enzyme.shallow(<App/>);
	expect(app.state().enabled).toEqual(true);

	app.instance().onInitError();
	expect(app.state().enabled).toEqual(false);
});

test('App component renders error as expected', () => {

	let app = Enzyme.shallow(<App/>);
	app.instance().onLoadError("No WebGL enabled");
	expect(app.state().errorMessage).toEqual("No WebGL enabled");

});

test('App component renders correctly as expected', () => {

	let app = Enzyme.shallow(<App/>);
	app.instance().updateMap({gridReference: "NT27"});
	expect(app.state().gridReference).toEqual("NT27");

});

