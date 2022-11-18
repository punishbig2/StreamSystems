import 'styles/main.scss';
import 'overlayscrollbars/css/OverlayScrollbars.css';

import FXOptionsUI from 'main';
import React from 'react';
import { createRoot } from 'react-dom/client';
import * as serviceWorker from 'serviceWorker';

const rootNode = document.getElementById('root');
if (rootNode === null) {
  throw new Error('cannot find root node');
}

const root = createRoot(rootNode);
root.render(<FXOptionsUI />);
// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service messages: https://bit.ly/CRA-PWA
serviceWorker.unregister();

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(function (registrations) {
    for (const registration of registrations) {
      void registration.unregister();
    }
  });
}
