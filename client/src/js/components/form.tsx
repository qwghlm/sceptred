import * as React from "react";

import { geocode } from '../lib/geocoder';
import { debounce } from '../lib/utils';
import { SearchResult, AutoComplete } from './autocomplete';

// The search form

interface SearchFormState {
    searchTerm: string;
    searchResults: SearchResult[] | null;
}
export class SearchForm extends React.Component<{onSelect: (SearchResult) => void}, SearchFormState> {

    doGeolookup: (string) => void;
    state: SearchFormState;
    autocomplete: AutoComplete | null;

    constructor(props) {
        super(props);
        this.state = {
            searchTerm: "",
            searchResults: null
        }
        this.doGeolookup = debounce(this._doGeolookup.bind(this), 400);
    }

    // Updates when form value is changed
    updateSearchTerm(value: string) {
        this.setState({
            searchTerm: value
        });
        if (value.length >= 3) {
            this.doGeolookup(value);
        }
    }

    _doGeolookup(value: string) {
        geocode(value)
            .then((results) => {
                this.setState({searchResults: results as SearchResult[]})
            })
            .catch((status) => {
                this.setState({searchResults: []})
            })
    }

    // Handle keypress
    handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {

        // Arrow up/down button should select next/previous list element
        if (this.autocomplete === null) {
            this.updateSearchTerm((e.target as HTMLInputElement).value);
        }
        else if (e.key == 'ArrowUp') {
            this.autocomplete.moveCursor(-1);
        }
        else if (e.key == 'ArrowDown') {
            this.autocomplete.moveCursor(1);
        }
        else if (e.key == 'Enter') {
            this.autocomplete.hitEnter();
        }
        else {
            this.updateSearchTerm((e.target as HTMLInputElement).value);
        }

    }

    onSelect = (result) => {
        this.setState({
            searchTerm: result.name,
            searchResults: null,
        });
        this.props.onSelect(result);
    }

    render() {

        return <div className="form-autocomplete">

            <div className="form-autocomplete-input">

                <input className="form-input" type="text" id="search-text"
                    value={this.state.searchTerm}
                    onChange={(e) => this.updateSearchTerm(e.target.value)}
                    onKeyUp={this.handleKey}
                    placeholder="Enter a place name..." />

                <label className="text-assistive" htmlFor="search-text">Enter an OS grid reference e.g. NT27</label>

            </div>

            <AutoComplete
                ref={(el) => this.autocomplete = el}
                results={this.state.searchResults}
                onSelect={this.onSelect} />

        </div>

    }
}
