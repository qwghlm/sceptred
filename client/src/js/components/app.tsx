import * as React from "react";

import { Map } from './map'
import { geocode } from '../lib/geocoder';
import { debounce } from '../lib/utils';

// Types for props and state

interface AppProps {}
interface AppState {

    enabled: boolean;

    searchTerm: string;
    searchResults: SearchResult[] | null;

    loading: boolean;
    mapValue: string;
    errorMessage: string;

}
interface SearchResult {
    name: string;
    gridReference: string;
}
interface SearchResultProps {
    name: string;
    gridReference: string;
    onSelect: (SearchResult) => void;
}

// An individual search result in the autocomplete

class SearchResult extends React.Component<SearchResultProps, {}> {

    render() {
        return <li className="menu-item">
            <a href="#" onClick={(e) => this.props.onSelect({
                name: this.props.name, gridReference: this.props.gridReference
            })}>
                {this.props.name}
            </a>
        </li>
    }
}

// Our app

export class App extends React.Component<AppProps, {}> {

    state: AppState;
    doGeolookup: (string) => void;

    // Initialise default state
    constructor(props: AppProps) {
        super(props);

        this.doGeolookup = debounce(this._doGeolookup.bind(this), 400);

        this.state = {
            enabled: true,

            searchTerm: "",
            searchResults: null,

            loading: false,
            mapValue: "",
            errorMessage: "",
        }
    }

    // Handler for if there is an error with the map
    onInitError = () => {
        this.setState({
            enabled: false
        });
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
                this.setState({searchResults: results})
            })
            .catch((status) => {
                this.setState({searchResults: []})
            });
    }

    // Handle keypress
    handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
        this.updateSearchTerm((e.target as HTMLInputElement).value);
    }

    // Perform search
    doSearch = (result) => {
        this.setState({
            loading: true,
            searchTerm: result.name,
            searchResults: null,
            errorMessage: "",
            mapValue: result.gridReference
        });
    }

    // When load is done
    onLoadSuccess = () => {
        this.setState({
            loading: false
        });
    }

    // When load fails
    onLoadError = (message: string) => {
        this.setState({
            errorMessage: message,
            loading: false
        });
    }

    // Renderer
    render() {

        var autocomplete;

        if (this.state.searchResults === null) {
            autocomplete = "";
        }
        else if (this.state.searchResults.length === 0) {
            autocomplete = <ul className="menu"><em>No results found</em></ul>
        }
        else {
            autocomplete = <ul className="menu">
                {this.state.searchResults.map((r, i) => <SearchResult key={i} onSelect={this.doSearch} {...r}/>)}
            </ul>;
        }

        const form = <div className={"columns form-wrapper " + (this.state.enabled ? "" : "d-none")}>

            <div className="column col-12">

                <div className="form-autocomplete">

                    <div className="form-autocomplete-input">

                        <input className="form-input" type="text" id="search-text"
                            value={this.state.searchTerm}
                            onChange={(e) => this.updateSearchTerm(e.target.value)}
                            onKeyUp={this.handleKey}
                            placeholder="Enter a place name..." />

                        <label className="text-assistive" htmlFor="search-text">Enter an OS grid reference e.g. NT27</label>

                    </div>

                    {autocomplete}

                </div>

            </div>

        </div>;

        // Render form, then error state, then map
        return <div>
            { form }
            <div className={"columns " + (this.state.errorMessage ? "" : "d-none")}>
                <div className="column col-12 mt-2 text-error">
                    Error: {this.state.errorMessage}
                </div>
            </div>
            <div className="columns">
                <div className="column col-12 mt-2">
                    <Map debug={false} gridReference={this.state.mapValue}
                         onInitError={this.onInitError}
                         onLoadError={this.onLoadError}
                         onLoadSuccess={this.onLoadSuccess} />
                </div>
            </div>

        </div>
    }
}
