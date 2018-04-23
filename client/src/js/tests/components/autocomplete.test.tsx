import * as React from "react";
import * as Enzyme from "enzyme";
import * as Adapter from "enzyme-adapter-react-16";

import { AutoCompleteItem, AutoComplete } from '../../components/autocomplete';

Enzyme.configure({ adapter: new Adapter() });

test('AutoCompleteItem component renders correctly', () => {

    let listener = jest.fn();
    let item = Enzyme.shallow(<AutoCompleteItem name="Edinburgh" gridReference="NT27" onSelect={listener} />);
    expect(listener.mock.calls.length).toEqual(0);

    item.find('a').simulate('click', { preventDefault: jest.fn() });
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
