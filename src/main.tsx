import {Workarea} from 'components/Workarea';

import 'fonts/fontawesome/css/all.min.css';
import 'main.css';

import React from 'react';
import 'react-mosaic-component/react-mosaic-component.css';
import {Provider} from 'react-redux';
import {store} from 'redux/store';
import {ThemeProvider} from 'styled-components';
import {theme} from 'theme';

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

