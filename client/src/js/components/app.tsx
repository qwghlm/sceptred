import * as React from "react";

import { SearchForm } from './form'
import { Map } from './map'

// Our app

interface AppState {
    enabled: boolean;
    gridReference: string;
    errorMessage: string;
}
export class App extends React.Component<{}, AppState> {

    state: AppState;

    // Initialise default state
    constructor(props: {}) {
        super(props);
        this.state = {
            enabled: true,
            errorMessage: "",
            gridReference: "",
        };
    }

    // Handler for if there is an error with the map
    onInitError = () => {
        this.setState({
            enabled: false
        });
    }

    // When load fails
    onLoadError = (message: string) => {
        this.setState({
            errorMessage: message,
        });
    }

    updateMap = (searchResult) => {
        this.setState({
            gridReference: searchResult.gridReference,
        });
    }

    // Renderer
    render() {

        // Render form, then error state, then map
        return <div>
            <div className={"columns form-wrapper " + (this.state.enabled ? "" : "d-none")}>
                <div className="column col-12">
                    <SearchForm onSelect={this.updateMap} />
                </div>
            </div>
            <div className={"columns " + (this.state.errorMessage ? "" : "d-none")}>
                <div className="column col-12 mt-2 text-error">
                    Error: {this.state.errorMessage}
                </div>
            </div>
            <div className="columns">
                <div className="column col-12 mt-2">
                    <Map debug={!window['SCEPTRED_PROD']}
                        gridReference={this.state.gridReference}
                        onInitError={this.onInitError}
                        onLoadError={this.onLoadError} />
                </div>
            </div>

        </div>;
    }
}
