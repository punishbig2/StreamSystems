import {Workarea} from 'components/Workarea';

import 'fonts/fontawesome/css/all.min.css';
import 'fonts/montserrat/font.css';
import 'styles/main.scss';

import React from 'react';
import {Provider} from 'react-redux';
import {store} from 'redux/store';
import {ThemeProvider} from 'styled-components';
import {theme} from 'theme';

Object.defineProperty(MouseEvent.prototype, 'ignore', {
  value: function () {
    this.preventDefault();
    this.stopImmediatePropagation();
  },
});

const FXOptionsUI: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <Provider store={store}>
        <Workarea/>
      </Provider>
    </ThemeProvider>
  );
};

export default FXOptionsUI;

