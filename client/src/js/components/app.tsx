import { h, Component } from "preact";
import { Map } from './map'
import { isValidGridref } from '../lib/grid';

interface AppProps {}
interface AppState {
    error: boolean;

    enabled: boolean;
    loading: boolean;

    formValue: string;
    mapValue: string;

}

export class App extends Component<AppProps, AppState> {

    constructor(props: AppProps) {
        super(props);
        this.state = { error: false, enabled: false, formValue: "", mapValue: "", loading: false}
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
            mapValue: this.state.formValue
        });
    }

    loadDone = () => {
        this.setState({
            loading: false
        });
    }

    errorOn = () => {
        this.setState({
            error: true
        });
    }

    render(props: AppProps, state: AppState) {

        const form = this.state.error ? "" : <div class="columns">

            <div class="column col-10">

                <input className="form-input" type="text" value={this.state.formValue}
                    onChange={this.handleKey} onKeyUp={this.handleKey}
                    placeholder="Enter an OS grid reference e.g. NT27" />

            </div>

            <div class="column col-2">

                <button className={"col-12 btn btn-primary"}
                    disabled={!this.state.enabled} onClick={this.doSearch} >Go</button>

            </div>

        </div>;

        // TODO Add loading state to button
        return <div>
            { form }
            <div class="columns">
                <div class="column col-12 mt-2">
                    <Map debug={true} gridReference={this.state.mapValue}
                         onError={this.errorOn} onLoadFinished={this.loadDone} />
                </div>
            </div>

        </div>
    }

}
