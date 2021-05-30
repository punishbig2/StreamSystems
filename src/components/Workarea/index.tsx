import { MessageBox } from "components/MessageBox";
import { MiddleOffice } from "components/MiddleOffice";
import { ModalWindow } from "components/ModalWindow";
import { ProgressView } from "components/progressView";
import { QuestionBox } from "components/QuestionBox";
import { TabBar } from "components/TabBar";
import { TradeConfirmation } from "components/TradeConfirmation";
import { Welcome } from "components/weolcome";
import { AccessDeniedView } from "components/Workarea/accessDeniedView";
import { UserNotFound } from "components/Workarea/userNotFound";
import { WorkareaError } from "components/Workarea/workareaError";
import { TradingWorkspace } from "components/Workspace";
import strings from "locales";
import { observer } from "mobx-react";
import { MessagesStore, MessagesStoreContext } from "mobx/stores/messagesStore";

import { themeStore } from "mobx/stores/themeStore";
import { WorkspaceStoreContext } from "mobx/stores/tradingWorkspaceStore";
import store from "mobx/stores/workareaStore";
import React, { ReactElement, useEffect, useMemo, useState } from "react";
import { WorkareaStatus } from "stateDefs/workareaState";
import { Message } from "types/message";
import { Symbol } from "types/symbol";
import { getUserIdFromUrl } from "utils/getIdFromUrl";

const Workarea: React.FC = (): ReactElement | null => {
  const { recentExecutions } = store;
  const { connected, user } = store;
  const [selectedToClose, setSelectedToClose] = useState<string | null>(null);
  const { CloseWorkspace } = strings;
  const personality: string = store.personality;
  const { theme } = store.preferences;
  const { workspaceAccessDenied } = store;
  const id: string | null = useMemo(getUserIdFromUrl, []);
  const messagesStore = React.useContext<MessagesStore>(MessagesStoreContext);

  useEffect(() => {
    themeStore.setTheme(theme);
  }, [theme]);

  useEffect(() => {
    if (id !== null) {
      store.initialize(id).catch(console.error);
    }
  }, [id]);

  useEffect(() => {
    if (!user || !connected) return;
    messagesStore.connect();
    return () => {
      messagesStore.disconnect();
    };
  }, [connected, messagesStore, user]);

  useEffect(() => {
    setTimeout(() => {
      messagesStore.reapplyFilters();
    }, 0);
  }, [messagesStore, personality]);

  const cancelCloseWorkspace = () => setSelectedToClose(null);
  const closeWorkspace = () => {
    store.closeWorkspace(selectedToClose as string).then(() => {});
    // Close the modal window
    setSelectedToClose(null);
  };
  const renderCloseQuestion = () => (
    <QuestionBox
      {...CloseWorkspace}
      onYes={closeWorkspace}
      onNo={cancelCloseWorkspace}
    />
  );

  const renderMessage = () => {
    const { recentExecutions } = store;
    const mapTrade = (trade: Message) => (
      <TradeConfirmation
        preferences={store.preferences}
        trade={trade}
        key={trade.ClOrdID}
        onClose={store.clearLastExecution}
      />
    );
    return (
      <div className={"message-detail"}>
        <div className={"title"}>Trade Confirmation</div>
        {recentExecutions.map(mapTrade)}
        <div className={"modal-buttons"}>
          <button className={"cancel"} onClick={store.clearLastExecution}>
            Close
          </button>
        </div>
      </div>
    );
  };

  const getActiveWorkspace = () => {
    const { workspaces, user, currentWorkspaceID } = store;
    if (store.status === WorkareaStatus.Welcome) return <Welcome />;
    if (user === null) return null;
    const symbols: ReadonlyArray<Symbol> = (() => {
      const { symbols, user } = store;
      return symbols.filter((symbol: Symbol): boolean => {
        const { regions } = user;
        if (regions === undefined) return false;
        return regions.includes(symbol.ccyGroup);
      });
    })();
    if (currentWorkspaceID === "mo") {
      return <MiddleOffice visible={true} />;
    } else {
      if (currentWorkspaceID === null) return null;
      const workspaceStore = workspaces[currentWorkspaceID];
      if (workspaceStore === undefined)
        throw new Error("invalid store for workspace");
      return (
        <WorkspaceStoreContext.Provider
          value={workspaceStore}
          key={workspaceStore.id}
        >
          <TradingWorkspace
            id={workspaceStore.id}
            isDefault={!workspaceStore.modified}
            visible={workspaceStore.id === currentWorkspaceID}
            tenors={store.tenors}
            /* Only filtered symbols */
            currencies={symbols}
            strategies={store.strategies}
            banks={store.banks}
            onModify={store.setWorkspaceModified}
          />
        </WorkspaceStoreContext.Provider>
      );
    }
  };

  const getFooter = () => {
    return (
      <div className={"footer"}>
        <TabBar
          entries={store.workspaces}
          active={store.currentWorkspaceID}
          connected={store.connected}
          setActiveTab={store.setWorkspace}
          onAddStandardWorkspace={store.addStandardWorkspace}
          onAddMiddleOfficeWorkspace={store.addMiddleOffice}
          onTabClosed={setSelectedToClose}
          onQuit={() => null}
          onWorkspaceRename={store.setWorkspaceName}
        />
      </div>
    );
  };

  const renderLoadingModal = (): ReactElement => {
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
            {getActiveWorkspace()}
            {getFooter()}
            <ModalWindow
              render={renderLoadingModal}
              isOpen={store.isCreatingWorkspace}
            />
            <ModalWindow
              render={renderCloseQuestion}
              isOpen={!!selectedToClose}
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
