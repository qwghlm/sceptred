import * as React from "react";
import * as ReactDOM from "react-dom";

import { isTouch, getFullScreenFunction } from '../lib/utils';

type MapFullScreenButtonProps = {
    onFullScreen: (any) => void,
};
export class MapFullScreenButton extends React.Component<MapFullScreenButtonProps, {}> {

    render() {

        var isCapable = !!getFullScreenFunction();
        if (!isCapable) {
            return "";
        }

        return <button className="btn btn-link" onClick={this.props.onFullScreen}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 18 18">
                <path d="M4.5 11H3v4h4v-1.5H4.5V11zM3 7h1.5V4.5H7V3H3v4zm10.5 6.5H11V15h4v-4h-1.5v2.5zM11 3v1.5h2.5V7H15V3h-4z" stroke="#FFFFFF" fill="#FFFFFF" />
            </svg>
        </button>;
    }
}

export class MapInstructions extends React.Component {

    render() {
        return <div className="instructions">
            <p className={isTouch() ? "d-none" : ""}>
                Drag your mouse to pan around the map. Hold down <code>Shift</code>+drag to rotate the world. Hold down <code>Ctrl</code>+drag to zoom, or alternatively use the mousewheel or scroll action on your touchpad.
            </p>
            <p className={isTouch() ? "" : "d-none"}>
                Swipe with a single finger to rotate the world, or swipe with two fingers to pan. You can pinch to zoom in and out.
            </p>
        </div>;
    }
}
