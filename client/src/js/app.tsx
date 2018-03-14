import { h, Component } from "preact";
import { Map } from './map'
import { isValidGridref } from './lib/grid';

interface AppProps {}
interface AppState {
    enabled: boolean;
    value: string;
    loading: boolean;
}

export class App extends Component<AppProps, AppState> {

    constructor(props: AppProps) {
        super(props);
        this.state = { enabled: false, value: "", loading: false}
    }

    componentDidMount() {

        var element = this.base.querySelector('.canvas-wrapper') as HTMLElement;
        new Map(
            element,
            {
                origin : [325000, 675000],
                heightFactor: 2,
                debug : true,
            }
        );

    }

    checkEnabled = (e: Event) => {
        var target = e.target as HTMLTextAreaElement;
        this.setState({
            value: target.value,
            enabled: isValidGridref(target.value),
        });
    }

    handleClick = (e: Event) => {
        this.setState({
            loading: true
        });
    }

    render(props: AppProps, state: AppState) {
        return <div class="columns">

            <div class="column col-12">
                <div class="canvas-wrapper"></div>
            </div>

            <div class="column col-10 mt-2">

                <input className="form-input" type="text" value={this.state.value}
                    onChange={this.checkEnabled} onKeyUp={this.checkEnabled}
                    placeholder="Enter an OS grid reference e.g. NT27" />

            </div>

            <div class="column col-2 mt-2">

                <button className={"col-12 btn btn-primary " + (this.state.loading ? "loading" : "")}
                    disabled={!this.state.enabled} onClick={this.handleClick} >Go</button>

            </div>
        </div>
    }

}
