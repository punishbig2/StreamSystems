import {Workarea} from 'components/Workarea';

import 'fonts/fontawesome/css/all.min.css';
import 'fonts/montserrat/font.css';

import React from 'react';
import {Provider} from 'react-redux';
import {store} from 'redux/store';
import {Settings} from 'settings';
import {ThemeProvider} from 'styled-components';
import 'styles/main.scss';
import {theme} from 'theme';

Object.defineProperty(MouseEvent.prototype, 'ignore', {
  value: function () {
    this.preventDefault();
    this.stopImmediatePropagation();
  },
});

const defaultSettings: Settings = {minSize: 10, defaultSize: 10};
const currentSettings: Settings = defaultSettings;
export const SettingsContext = React.createContext<Settings>(currentSettings);

const FXOptionsUI: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <SettingsContext.Provider value={currentSettings}>
        <Provider store={store}>
          <Workarea/>
        </Provider>
      </SettingsContext.Provider>
    </ThemeProvider>
  );
};

export default FXOptionsUI;

