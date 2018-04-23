import * as React from "react";
import * as Enzyme from "enzyme";
import * as Adapter from "enzyme-adapter-react-16";

import { SearchForm } from '../../components/form';

Enzyme.configure({ adapter: new Adapter() });

jest.useFakeTimers();

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

test('SearchForm component renders correctly', async () => {

    let listener = jest.fn();

    let searchForm = Enzyme.shallow(<SearchForm onSelect={listener} />);
    let input = searchForm.find('input');

    // Check initial state
    expect(searchForm.state().searchTerm).toEqual("");
    expect(searchForm.state().searchResults).toEqual(null);
    expect(listener.mock.calls.length).toEqual(0);

    // A short search should do no change to results
    input.simulate('keyup', { target: { value: "Ed"} });
    await jest.runAllTimers();
    expect(searchForm.state().searchTerm).toEqual("Ed");
    expect(searchForm.state().searchResults).toEqual(null);
    expect(listener.mock.calls.length).toEqual(0);

    // A fuller search now should produce results, but no select event yet
    input.simulate('keyup', { target: { value: "Edinburgh"} });
    await jest.runAllTimers();
    expect(searchForm.state().searchTerm).toEqual("Edinburgh");
    expect(searchForm.state().searchResults.length).toEqual(1);
    expect(listener.mock.calls.length).toEqual(0);

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
