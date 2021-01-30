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

import messagesStore from "mobx/stores/messagesStore";
import { themeStore } from "mobx/stores/themeStore";
import store, { WorkspaceDef, WorkspaceType } from "mobx/stores/workareaStore";
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
  }, [connected, user]);

  useEffect(() => {
    setTimeout(() => {
      messagesStore.reapplyFilters();
    }, 0);
  }, [personality]);

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
    return Object.values(workspaces).map(
      ({ id, type, isDefault }: WorkspaceDef) => {
        if (type === WorkspaceType.Trading) {
          return (
            <TradingWorkspace
              id={id}
              key={id}
              isDefault={isDefault}
              visible={id === currentWorkspaceID}
              tenors={store.tenors}
              /* Only filtered symbols */
              currencies={symbols}
              strategies={store.strategies}
              banks={store.banks}
              store={store.getWorkspaceStore(id)}
              onModify={store.setWorkspaceModified}
            />
          );
        } else {
          return <MiddleOffice key={id} visible={id === currentWorkspaceID} />;
        }
      }
    );
  };

  const getFooter = () => {
    return (
      <div className={"footer"}>
        <TabBar
          entries={store.workspaces}
          active={store.currentWorkspaceID}
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
