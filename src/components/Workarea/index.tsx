import { MessageBox } from 'components/MessageBox';
import { ModalWindow } from 'components/ModalWindow';
import { ProgressView } from 'components/progressView';
import { TradeConfirmation } from 'components/TradeConfirmation';
import { AccessDeniedView } from 'components/Workarea/accessDeniedView';
import { DisconnectedDisabler } from 'components/Workarea/disconnectedDisabler';
import { Footer } from 'components/Workarea/footer';
import { UserNotAllowedAtThisTime } from 'components/Workarea/userNotAllowedAtThisTime';
import { UserNotFound } from 'components/Workarea/userNotFound';
import { WorkareaError } from 'components/Workarea/workareaError';
import { Workspaces } from 'components/Workarea/workspaces';
import { DateTimeFormatStore } from 'mobx/stores/dateTimeFormatStore';
import { MessagesStore, MessagesStoreContext } from 'mobx/stores/messagesStore';
import { themeStore } from 'mobx/stores/themeStore';
import store from 'mobx/stores/workareaStore';
import { observer } from 'mobx-react';
import React from 'react';
import signalRManager from 'signalR/signalRClient';
import { WorkareaStatus } from 'stateDefs/workareaState';
import { Message } from 'types/message';
import { getUserIdFromUrl } from 'utils/getIdFromUrl';

export const Workarea: React.FC = observer((): React.ReactElement | null => {
  const { recentExecutions, connected, user } = store;
  const personality: string = store.personality;
  const { theme, timezone } = store.preferences;
  const { workspaceAccessDenied } = store;
  const id: string | null = React.useMemo(getUserIdFromUrl, []);
  const messagesStore = React.useContext<MessagesStore>(MessagesStoreContext);
  const dateTimeFormatStore = React.useContext<DateTimeFormatStore>(DateTimeFormatStore.Context);

  React.useEffect((): void => {
    themeStore.setTheme(theme);
  }, [theme]);

  React.useEffect((): VoidFunction => {
    const interval = setInterval((): void => {
      void store.checkVersion();
    }, 600000);
    return (): void => {
      clearInterval(interval);
    };
  }, []);

  React.useEffect((): void => {
    store.initialize(id).catch(console.error);
  }, [id]);

  React.useEffect((): VoidFunction | void => {
    if (!user || !connected) return;
    messagesStore.connect();
    return (): void => {
      messagesStore.disconnect();
    };
  }, [connected, messagesStore, user]);

  React.useEffect((): void => {
    setTimeout(() => {
      messagesStore.reset();
    }, 0);
  }, [messagesStore, personality]);

  React.useEffect((): void => {
    dateTimeFormatStore.setTimezone(timezone);
  }, [dateTimeFormatStore, timezone]);

  React.useEffect((): VoidFunction | void => {
    if (connected) return;
    const reconnect = (): void => {
      signalRManager.connect();
    };
    window.addEventListener('click', reconnect);

    return (): void => {
      window.removeEventListener('click', reconnect);
    };
  }, [connected]);

  const renderNewVersionModal = (): React.ReactElement => {
    return (
      <div className="message-detail wide">
        <div className="title">New Version Available!</div>
        <p className="message">
          Please click the button below to upgrade your application to the most recent version.
        </p>
        <div className="modal-buttons">
          <button className="cancel" onClick={store.upgradeApplication}>
            <i className="fa fa-exclamation-circle" /> Upgrade!
          </button>
        </div>
      </div>
    );
  };

  const renderMessage = (): React.ReactElement => {
    const { recentExecutions } = store;
    return (
      <div className="message-detail">
        <div className="title">Trade Confirmation</div>
        {recentExecutions.map((trade: Message) => (
          <TradeConfirmation
            preferences={store.preferences}
            trade={trade}
            key={trade.ClOrdID}
            onClose={store.clearLastExecution}
          />
        ))}
        <div className="modal-buttons">
          <button className="cancel" onClick={store.clearLastExecution}>
            Close
          </button>
        </div>
      </div>
    );
  };

  const renderLoadingModal = (): React.ReactElement => {
    const message =
      'We are setting up your preset workspace, this will not take long. Please be patient.';
    return (
      <MessageBox
        title="Creating Workspace"
        message={message}
        buttons={() => null}
        color="good"
        icon="spinner"
      />
    );
  };

  switch (store.status) {
    case WorkareaStatus.Error:
      return (
        <WorkareaError
          title="Oops, there was an error while loading"
          detail={
            'We had trouble communicating with the data server. There might be a problem with your connection.'
          }
        />
      );
    case WorkareaStatus.UserNotFound:
      return <UserNotFound />;
    case WorkareaStatus.Starting:
      return null;
    case WorkareaStatus.NotAllowedAtThisTime:
      return <UserNotAllowedAtThisTime />;
    case WorkareaStatus.Initializing:
      if (!store.loadingMessage) return null;
      return (
        <ProgressView
          value={store.loadingProgress}
          message={store.loadingMessage}
          title="Loading: Application"
        />
      );
    case WorkareaStatus.Welcome:
    case WorkareaStatus.Ready:
      if (workspaceAccessDenied) {
        return <AccessDeniedView onClose={(): void => store.closeAccessDeniedView()} />;
      } else {
        return (
          <>
            <Workspaces />
            <Footer />
            <ModalWindow render={renderLoadingModal} isOpen={store.isCreatingWorkspace} />
            <ModalWindow render={renderNewVersionModal} isOpen={store.isShowingNewVersionModal} />
            <ModalWindow render={renderMessage} isOpen={recentExecutions.length > 0} />
            <DisconnectedDisabler disconnected={!store.connected} />
          </>
        );
      }
    default:
      // Should never happen
      return null;
  }
});
