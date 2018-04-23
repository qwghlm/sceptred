import * as React from "react";
import * as ReactDOM from "react-dom";

export interface SearchResult {
    name: string;
    gridReference: string;
}
interface AutoCompleteItemProps {
    name: string;
    gridReference: string;
    isHovered: boolean;
    onSelect: (SearchResult) => void;
}

// An individual search result in the autocomplete

export class AutoCompleteItem extends React.Component<AutoCompleteItemProps, {}> {

    onClick = (e) => {
        e.preventDefault();
        this.props.onSelect({
            name: this.props.name,
            gridReference: this.props.gridReference
        });
    }

    render() {
        return <li className={this.props.isHovered ? "menu-item fake-hover" : "menu-item"}>
            <a href="#" onClick={this.onClick}>
                {this.props.name}
            </a>
        </li>;
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

    resetCursor = (e) => {
        this.setState({
            cursor: -1
        });
    }

    moveCursor(step) {

        // Sets new cursor position
        this.setState((prevState: AutoCompleteState, props: AutoCompleteProps) => {
            const newCursor = prevState.cursor + step;

            // If no results, or cursor is at its limits, do nothing
            if (props.results == null || newCursor < 0 || newCursor > props.results.length - 1) {
                return {
                    cursor: prevState.cursor
                };
            }

            // Else return new position
            return {
                cursor: newCursor
            };
        });
    }

    hitEnter() {

        if (this.state.cursor >= 0 && this.props.results != null) {
            const result = this.props.results[this.state.cursor];
            this.props.onSelect({
                name: result.name,
                gridReference: result.gridReference,
            });
        }
    }

    render() {

        if (this.props.results === null) {
            return null;
        }
        else if (this.props.results.length === 0) {
            return <ul className="menu"><em>No results found</em></ul>;
        }
        else {
            return <ul className="menu" onMouseMove={this.resetCursor}>
                {this.props.results.map((r, i) =>
                    <AutoCompleteItem key={i} isHovered={i == this.state.cursor} onSelect={this.props.onSelect} {...r}/>
                 )}
            </ul>;
        }
    }
}
