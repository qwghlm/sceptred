import * as React from "react";

import { Map } from './map'
import { isValidGridref } from '../lib/grid';

// Types for props and state

interface AppProps {}
interface AppState {

    enabled: boolean;

    formValue: string;
    buttonEnabled: boolean;

    loading: boolean;
    mapValue: string;
    errorMessage: string;

}

// Our app

export class App extends React.Component<AppProps, {}> {

    state: AppState;

    // Initialise default state
    constructor(props: AppProps) {
        super(props);
        this.state = { enabled: true, buttonEnabled: false,  loading: false, errorMessage: "",
            formValue: "", mapValue: "" }
    }

    // Handler for if there is a webgl error in the map
    onInitError = () => {
        this.setState({
            enabled: false
        });
    }

    // Updates when form value is changed
    updateFormValue(value: string) {
        this.setState({
            formValue: value,
            buttonEnabled: isValidGridref(value),
        });
    }

    // Handle keypress
    handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
        this.updateFormValue((e.target as HTMLInputElement).value);
        if (this.state.buttonEnabled && e.keyCode === 13) {
            this.doSearch();
        }
    }

    // Perform search
    doSearch = () => {
        this.setState({
            loading: true,
            errorMessage: "",
            mapValue: this.state.formValue
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

        const form = this.state.enabled ? <div className="columns form-wrapper">

            <div className="column col-10 col-sm-9">

                <input className="form-input" type="text" id="search-text"
                    value={this.state.formValue}
                    onChange={(e) => this.updateFormValue(e.target.value)}
                    onKeyUp={this.handleKey}
                    placeholder="Enter an OS grid reference e.g. NT27" />

                <label className="text-assistive" htmlFor="search-text">Enter an OS grid reference e.g. NT27</label>

            </div>

            <div className="column col-2 col-sm-3">

                <button className={"btn btn-primary btn-block " + (this.state.loading ? "loading" : "")}
                    disabled={!this.state.buttonEnabled} onClick={this.doSearch}>Go</button>

            </div>

        </div> : "";

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
