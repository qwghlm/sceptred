import * as React from "react";
import * as Enzyme from "enzyme";
import * as Adapter from "enzyme-adapter-react-16";

import { App, AutoCompleteItem, AutoComplete, SearchForm } from '../../components/app';

Enzyme.configure({ adapter: new Adapter() })

jest.mock("../../components/map", () => {
	return { Map : jest.fn(() => "") }
});

// Mock our connection to the geocoding library
jest.mock("../../lib/geocoder", () => {
	return {
		geocode : jest.fn((searchTerm) => {
			return new Promise((resolve, reject) => {
				if (searchTerm == 'Edinburgh') {
					resolve([{name: "Edinburgh, UK", gridReference: "NT27"}]);
				}
				else {
					reject("No places found");
				}
			});
		})
	}
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

test('AutoCompleteItem component renders correctly', () => {

	let listener = jest.fn();
	let item = Enzyme.shallow(<AutoCompleteItem name="Edinburgh" gridReference="NT27" onSelect={listener} />);
	expect(listener.mock.calls.length).toEqual(0);

	item.find('a').simulate('click');
	expect(listener.mock.calls.length).toEqual(1);
	expect(listener.mock.calls[0][0]).toEqual({
		name: "Edinburgh",
		gridReference: "NT27",
	});

});

test('AutoComplete component renders correctly', () => {

	let listener = jest.fn();

	// Empty autocomplete is null
	let emptyAutocomplete = Enzyme.shallow(<AutoComplete results={null} onSelect={listener} />);
	expect(emptyAutocomplete.html()).toEqual(null);

	// Autocomplete with no results is empty
	let noResultsAutocomplete = Enzyme.shallow(<AutoComplete results={[]} onSelect={listener} />);
	expect(noResultsAutocomplete.html()).toContain("No results found");

	// Autocomplete with results has results, and the Select event travels upward
	let results = [{name: "Edinburgh", gridReference: "NT27"}];
	let resultsAutocomplete = Enzyme.shallow(<AutoComplete results={results} onSelect={listener} />);
	expect(resultsAutocomplete.html()).toContain("Edinburgh");

	expect(listener.mock.calls.length).toEqual(0);
	resultsAutocomplete.find('AutoCompleteItem').simulate('select');
	expect(listener.mock.calls.length).toEqual(1);

});

test('SearchForm component renders correctly', async () => {

	let listener = jest.fn();

	let searchForm = Enzyme.shallow(<SearchForm onSelect={listener} />);
	let input = searchForm.find('input');

	// Check initial state
	expect(searchForm.state().searchTerm).toEqual("");
	expect(searchForm.state().searchResults).toEqual(null);
	expect(listener.mock.calls.length).toEqual(0)

	// A short search should do no change to results
	input.simulate('keyup', { target: { value: "Ed"} });
	await jest.runAllTimers();
	expect(searchForm.state().searchTerm).toEqual("Ed");
	expect(searchForm.state().searchResults).toEqual(null);
	expect(listener.mock.calls.length).toEqual(0)

	// A fuller search now should produce results, but no select event yet
	input.simulate('keyup', { target: { value: "Edinburgh"} });
	await jest.runAllTimers();
	expect(searchForm.state().searchTerm).toEqual("Edinburgh");
	expect(searchForm.state().searchResults.length).toEqual(1);
	expect(listener.mock.calls.length).toEqual(0)

	// Trigger a select event on the AutoComplete
	let eventData = {name: "Edinburgh, UK", gridReference: "NT27"};
	searchForm.find('AutoComplete').simulate('select', eventData);
	expect(searchForm.state().searchTerm).toEqual("Edinburgh, UK");
	expect(searchForm.state().searchResults).toEqual(null);
	expect(listener.mock.calls.length).toEqual(1);
	expect(listener.mock.calls[0][0]).toEqual(eventData);

	// Now do a bad search
	input.simulate('change', { target: { value: "Xxxx"} });
	await jest.runAllTimers();
	await jest.runAllTimers();
	expect(searchForm.state().searchTerm).toEqual("Xxxx");
	expect(searchForm.state().searchResults).toEqual([]);

});
