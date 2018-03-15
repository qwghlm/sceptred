import { h, Component } from "preact";
import { Map } from './map'
import { isValidGridref } from '../lib/grid';

interface AppProps {}
interface AppState {
    enabled: boolean;
    loading: boolean;

    formValue: string;
    mapValue: string;

}

export class App extends Component<AppProps, AppState> {

    constructor(props: AppProps) {
        super(props);
        this.state = { enabled: false, formValue: "", mapValue: "", loading: false}
    }

    checkEnabled = (e: Event) => {
        var target = e.target as HTMLTextAreaElement;
        this.setState({
            formValue: target.value,
            enabled: isValidGridref(target.value),
        });
    }

    handleClick = (e: Event) => {
        this.setState({
            loading: true,
            mapValue: this.state.formValue
        });
    }

    loadDone = (e: Event) => {
        this.setState({
            loading: false
        });
    }

    render(props: AppProps, state: AppState) {

        // TODO Add loading state to button
        return <div class="columns">

            <div class="column col-10">

                <input className="form-input" type="text" value={this.state.formValue}
                    onChange={this.checkEnabled} onKeyUp={this.checkEnabled}
                    placeholder="Enter an OS grid reference e.g. NT27" />

            </div>

            <div class="column col-2">

                <button className={"col-12 btn btn-primary"}
                    disabled={!this.state.enabled} onClick={this.handleClick} >Go</button>

            </div>

            <div class="column col-12 mt-2">
                <Map debug={true} gridReference={this.state.mapValue} />
            </div>

        </div>
    }

}
