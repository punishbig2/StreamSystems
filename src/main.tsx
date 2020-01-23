import whyDidYouRender from '@welldone-software/why-did-you-render';
import {Workarea} from 'components/Workarea';

import 'fonts/fontawesome/css/all.min.css';
import 'fonts/montserrat/font.css';

import React from 'react';
import {Provider} from 'react-redux';
import {store} from 'redux/store';
import {Settings} from 'settings';
import 'styles/main.scss';

Object.defineProperty(MouseEvent.prototype, "ignore", {
  value: function() {
    this.preventDefault();
    this.stopImmediatePropagation();
  }
});

const defaultSettings: Settings = {};
const currentSettings: Settings = defaultSettings;
export const SettingsContext = React.createContext<Settings>(currentSettings);

whyDidYouRender(React);

const FXOptionsUI: React.FC = () => {
  return (
    <SettingsContext.Provider value={currentSettings}>
      <Provider store={store}>
        <Workarea />
      </Provider>
    </SettingsContext.Provider>
  );
};

export default FXOptionsUI;
