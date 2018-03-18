import { h, Component } from "preact";
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

export class App extends Component<AppProps, AppState> {

    constructor(props: AppProps) {
        super(props);
        this.state = { webglEnabled: true, enabled: false,  loading: false, errorMessage: "",
            formValue: "", mapValue: "" }
    }

    handleKey = (e: Event) => {
        var target = e.target as HTMLTextAreaElement;
        this.setState({
            formValue: target.value,
            enabled: isValidGridref(target.value),
        });

        if ((e as KeyboardEvent).keyCode === 13) {
            this.doSearch(e);
        }
    }

    doSearch = (e: Event) => {
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

    render(props: AppProps, state: AppState) {

        const form = this.state.webglEnabled ? <div class="columns">

            <div class="column col-10">

                <input className="form-input" type="text" value={this.state.formValue}
                    onChange={this.handleKey} onKeyUp={this.handleKey}
                    placeholder="Enter an OS grid reference e.g. NT27" />

            </div>

            <div class="column col-2">

                <button className={"col-12 btn btn-primary"}
                    disabled={!this.state.enabled} onClick={this.doSearch} >Go</button>

            </div>

        </div> : "";

        // TODO Add loading state to button
        return <div>
            { form }
            <div class={"columns " + (this.state.errorMessage ? "" : "d-none")}>
                <div class="column col-12 mt-2 text-error">
                    Error: {this.state.errorMessage}
                </div>
            </div>
            <div class="columns">
                <div class="column col-12 mt-2">
                    <Map debug={true} gridReference={this.state.mapValue}
                         onInitError={this.handleWebglError}
                         onLoadError={this.handleLoadError}
                         onLoadFinished={this.loadDone} />
                </div>
            </div>

        </div>
    }

}
