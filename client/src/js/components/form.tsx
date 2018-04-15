import * as React from "react";

import { geocode } from '../lib/geocoder';
import { debounce } from '../lib/utils';

interface SearchResult {
    name: string;
    gridReference: string;
}
interface SearchResultProps {
    name: string;
    gridReference: string;
    isSelected: boolean;
    onSelect: (SearchResult) => void;
}

// An individual search result in the autocomplete

export class AutoCompleteItem extends React.Component<SearchResultProps, {}> {

    render() {
        return <li className={this.props.isSelected ? "menu-item fake-hover" : "menu-item"}>
            <a href="#" onClick={(e) => {
                e.preventDefault();
                this.props.onSelect({
                    name: this.props.name,
                    gridReference: this.props.gridReference
                })
            }}>
                {this.props.name}
            </a>
        </li>
    }
}

// The entire autocomplete

interface AutoCompleteProps {
    results: SearchResult[] | null,
    onSelect: (SearchResult) => void
}
interface AutoCompleteState {
    cursor: number,
}
export class AutoComplete extends React.Component<AutoCompleteProps, AutoCompleteState> {

    constructor(props) {
        super(props);
        this.state = {
            cursor: -1
        };
    }

    moveCursor(step) {

        this.setState((prevState: AutoCompleteState, props: AutoCompleteProps) => {
            const newCursor = prevState.cursor + step;
            if (props.results == null || newCursor < 0 || newCursor > props.results.length - 1) {
                return {
                    cursor: prevState.cursor
                }
            }
            return {
                cursor: newCursor
            }
        });
    }

    render() {

        if (this.props.results === null) {
            return null;
        }
        else if (this.props.results.length === 0) {
            return <ul className="menu"><em>No results found</em></ul>
        }
        else {
            return <ul className="menu">
                {this.props.results.map((r, i) =>
                    <AutoCompleteItem key={i} isSelected={i == this.state.cursor} onSelect={this.props.onSelect} {...r}/>
                 )}
            </ul>;
        }
    }
}

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
        if (e.key == 'ArrowUp' && this.autocomplete !== null) {
            this.autocomplete.moveCursor(-1);
        }
        else if (e.key == 'ArrowDown' && this.autocomplete !== null) {
            this.autocomplete.moveCursor(1);
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
