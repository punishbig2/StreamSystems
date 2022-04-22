import FXOptionsUI from "main";
import "styles/main.scss";
import "overlayscrollbars/css/OverlayScrollbars.css";
import React from "react";
import * as serviceWorker from "./serviceWorker";
import { createRoot } from "react-dom/client";

const root = createRoot(document.getElementById("root")!);
root.render(<FXOptionsUI />);
// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service messages: https://bit.ly/CRA-PWA
serviceWorker.unregister();

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then(function (registrations) {
    for (const registration of registrations) {
      void registration.unregister();
    }
  });
}
