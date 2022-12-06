import { MuiThemeProvider } from '@material-ui/core';
import { Workarea } from 'components/Workarea';
import { WorkareaError } from 'components/Workarea/workareaError';
import { useSignOutOnIdleTimeout } from 'hooks/useSignOutOnIdleTimeout';
import { DateTimeFormatStore } from 'mobx/stores/dateTimeFormatStore';
import { MessagesStore, MessagesStoreContext } from 'mobx/stores/messagesStore';
import { themeStore } from 'mobx/stores/themeStore';
import workareaStore from 'mobx/stores/workareaStore';
import { observer } from 'mobx-react';
import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { createTheme } from 'styles/theme';

const MIN_SCREEN_WIDTH = 1024;

const FXOptionsUI: React.FC = observer((): React.ReactElement => {
  const { theme, fontSize, fontFamily } = themeStore;
  const [inadequateScreen, setInadequateScreen] = useState<boolean>(false);

  const { screen } = window;
  const width = screen.availWidth;
  const height = screen.availHeight;

  console.log(Math.floor(Math.sqrt(width ** 2 + height ** 2) / 96));

  useSignOutOnIdleTimeout();

  useEffect((): void => {
    const { body } = document;
    const html = document.getElementsByTagName('html')[0] as HTMLElement;
    body.setAttribute('class', theme + '-theme');

    html.style.fontSize = `${fontSize}px`;
    html.style.fontFamily = fontFamily;
  }, [theme, fontSize, fontFamily]);

  useEffect((): VoidFunction => {
    const checkWindowWidth = (): void => {
      setInadequateScreen(window.innerWidth < MIN_SCREEN_WIDTH);
    };
    checkWindowWidth();

    window.addEventListener('resize', checkWindowWidth);
    return (): void => {
      window.removeEventListener('resize', checkWindowWidth);
    };
  }, []);

  useEffect((): VoidFunction => {
    const onFocus = (): void => {
      void workareaStore.checkVersion();
    };
    window.addEventListener('focus', onFocus, true);
    return (): void => {
      window.removeEventListener('focus', onFocus, true);
    };
  });

  if (inadequateScreen) {
    return (
      <MuiThemeProvider theme={createTheme(theme, fontFamily)}>
        <DateTimeFormatStore.Provider value={new DateTimeFormatStore()}>
          <MessagesStoreContext.Provider value={new MessagesStore()}>
            <WorkareaError
              title="Your screen is too small to display this application"
              detail={
                `Please try to run this application on a window with more than ${MIN_SCREEN_WIDTH}px` +
                ' of width (it should match your resolution unless you have scaling enabled)'
              }
              shouldReload={false}
            />
          </MessagesStoreContext.Provider>
        </DateTimeFormatStore.Provider>
      </MuiThemeProvider>
    );
  }

  return (
    <MuiThemeProvider theme={createTheme(theme, fontFamily)}>
      <Router>
        <Workarea />
      </Router>
    </MuiThemeProvider>
  );
});

export default FXOptionsUI;
