import * as React from "react";

import { Map } from './map'
import { isValidGridref } from '../lib/grid';

interface AppProps {}
interface AppState {

    webglEnabled: boolean;

    enabled: boolean;
    loading: boolean;
    errorMessage: string;

    formValue: string;
    mapValue: string;

}

export class App extends React.Component<AppProps, {}> {

    state: AppState;

    constructor(props: AppProps) {
        super(props);
        this.state = { webglEnabled: true, enabled: false,  loading: false, errorMessage: "",
            formValue: "", mapValue: "" }
    }

    updateFormValue(value: string) {
        this.setState({
            formValue: value,
            enabled: isValidGridref(value),
        });
    }

    handleKey = (e) => {
        this.updateFormValue(e.target.value);
        if (e.keyCode === 13) {
            this.doSearch();
        }
    }

    doSearch = () => {
        this.setState({
            loading: true,
            errorMessage: "",
            mapValue: this.state.formValue
        });
    }

    loadDone = () => {
        this.setState({
            loading: false
        });
    }

    handleWebglError = () => {
        this.setState({
            webglEnabled: true
        });
    }

    handleLoadError = (message: string) => {
        this.setState({
            errorMessage: message
        });
    }

    render() {

        const form = this.state.webglEnabled ? <div className="columns">

            <div className="column col-10">

                <input className="form-input" type="text" value={this.state.formValue}
                    onChange={(e) => this.updateFormValue(e.target.value)}
                    onKeyUp={this.handleKey}
                    placeholder="Enter an OS grid reference e.g. NT27" />

            </div>

            <div className="column col-2">

                <button className={"col-12 btn btn-primary"}
                    disabled={!this.state.enabled} onClick={this.doSearch}>Go</button>

            </div>

        </div> : "";

        // TODO Add loading state to button
        return <div>
            { form }
            <div className={"columns " + (this.state.errorMessage ? "" : "d-none")}>
                <div className="column col-12 mt-2 text-error">
                    Error: {this.state.errorMessage}
                </div>
            </div>
            <div className="columns">
                <div className="column col-12 mt-2">
                    <Map debug={true} gridReference={this.state.mapValue}
                         onInitError={this.handleWebglError}
                         onLoadError={this.handleLoadError}
                         onLoadFinished={this.loadDone} />
                </div>
            </div>

        </div>
    }

}
