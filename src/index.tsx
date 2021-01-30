import "./wydr";
import FXOptionsUI from "main";
import "styles/main.scss";
import "overlayscrollbars/css/OverlayScrollbars.css";
import React from "react";
import ReactDOM from "react-dom";
import * as serviceWorker from "./serviceWorker";

ReactDOM.render(<FXOptionsUI />, document.getElementById("root"));
// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
