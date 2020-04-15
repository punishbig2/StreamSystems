import { Workarea } from 'components/Workarea';

import 'fonts/fontawesome/css/all.min.css';
import 'fonts/montserrat/font.css';

import React from 'react';
import 'styles/main.scss';
import { createMuiTheme, MuiThemeProvider } from '@material-ui/core';
import whyDidYouRender from '@welldone-software/why-did-you-render';

Object.defineProperty(MouseEvent.prototype, 'ignore', {
  value: function () {
    this.preventDefault();
    this.stopImmediatePropagation();
  },
});

whyDidYouRender(React);

const theme = createMuiTheme({
  palette: {
    primary: {
      main: '#407af0',
      dark: '#2058c0',
    },
    secondary: {
      main: '#407af0',
      dark: '#2058c0',
    },
  },
});

const FXOptionsUI: React.FC = () => {
  return (
    <MuiThemeProvider theme={theme}>
      <Workarea/>
    </MuiThemeProvider>
  );
};

export default FXOptionsUI;
