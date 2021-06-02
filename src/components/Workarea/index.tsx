import { MessageBox } from "components/MessageBox";
import { ModalWindow } from "components/ModalWindow";
import { ProgressView } from "components/progressView";
import { TradeConfirmation } from "components/TradeConfirmation";
import { AccessDeniedView } from "components/Workarea/accessDeniedView";
import { ActiveWorkspace } from "components/Workarea/activeWorkspaces";
import { Footer } from "components/Workarea/footer";
import { UserNotFound } from "components/Workarea/userNotFound";
import { WorkareaError } from "components/Workarea/workareaError";
import { observer } from "mobx-react";
import { MessagesStore, MessagesStoreContext } from "mobx/stores/messagesStore";

import { themeStore } from "mobx/stores/themeStore";
import store from "mobx/stores/workareaStore";
import React from "react";
import { WorkareaStatus } from "stateDefs/workareaState";
import { Message } from "types/message";
import { getUserIdFromUrl } from "utils/getIdFromUrl";

const Workarea: React.FC = (): React.ReactElement | null => {
  const { recentExecutions } = store;
  const { connected, user } = store;
  const personality: string = store.personality;
  const { theme } = store.preferences;
  const { workspaceAccessDenied } = store;
  const id: string | null = React.useMemo(getUserIdFromUrl, []);
  const messagesStore = React.useContext<MessagesStore>(MessagesStoreContext);

  React.useEffect((): void => {
    themeStore.setTheme(theme);
  }, [theme]);

  React.useEffect((): void => {
    if (id !== null) {
      store.initialize(id).catch(console.error);
    }
  }, [id]);

  React.useEffect((): (() => void) | void => {
    if (!user || !connected) return;
    messagesStore.connect();
    return (): void => {
      messagesStore.disconnect();
    };
  }, [connected, messagesStore, user]);

  React.useEffect((): void => {
    setTimeout(() => {
      messagesStore.reapplyFilters();
    }, 0);
  }, [messagesStore, personality]);

  const renderMessage = () => {
    const { recentExecutions } = store;
    return (
      <div className={"message-detail"}>
        <div className={"title"}>Trade Confirmation</div>
        {recentExecutions.map((trade: Message) => (
          <TradeConfirmation
            preferences={store.preferences}
            trade={trade}
            key={trade.ClOrdID}
            onClose={store.clearLastExecution}
          />
        ))}
        <div className={"modal-buttons"}>
          <button className={"cancel"} onClick={store.clearLastExecution}>
            Close
          </button>
        </div>
      </div>
    );
  };

  const renderLoadingModal = (): React.ReactElement => {
    const message: string =
      "We are setting up your preset workspace, this will not take long. Please be patient.";
    return (
      <MessageBox
        title={"Creating Workspace"}
        message={message}
        buttons={() => null}
        color={"good"}
        icon={"spinner"}
      />
    );
  };
  switch (store.status) {
    case WorkareaStatus.Error:
      return (
        <WorkareaError
          title={"Oops, there was an error while loading"}
          detail={
            "We had trouble communicating with the data server. There might be a problem with your connection."
          }
        />
      );
    case WorkareaStatus.UserNotFound:
      return <UserNotFound />;
    case WorkareaStatus.Starting:
      return null;
    case WorkareaStatus.Initializing:
      if (!store.loadingMessage) return null;
      return (
        <ProgressView
          value={store.loadingProgress}
          message={store.loadingMessage}
          title={"Loading: Application"}
        />
      );
    case WorkareaStatus.Welcome:
    case WorkareaStatus.Ready:
      if (workspaceAccessDenied) {
        return (
          <AccessDeniedView
            onClose={(): void => store.closeAccessDeniedView()}
          />
        );
      } else {
        return (
          <>
            <ActiveWorkspace />
            <Footer />
            <ModalWindow
              render={renderLoadingModal}
              isOpen={store.isCreatingWorkspace}
            />

            <ModalWindow
              render={renderMessage}
              isOpen={recentExecutions.length > 0}
            />
          </>
        );
      }
    default:
      // Should never happen
      return null;
  }
};

const observed = observer(Workarea);
export { observed as Workarea };
