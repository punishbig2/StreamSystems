import { ModalWindow } from 'components/ModalWindow';
import { QuestionBox } from 'components/QuestionBox';
import { TabBar } from 'components/TabBar';
import { UserNotFound } from 'components/Workarea/userNotFound';
import { WorkareaError } from 'components/Workarea/workareaError';
import { Workspace } from 'components/Workspace';
import strings from 'locales';
import React, { ReactElement, useEffect, useState } from 'react';
import { WorkareaStatus } from 'stateDefs/workareaState';
import { Message } from 'interfaces/message';
import { TradeConfirmation } from 'components/TradeConfirmation';
import { CurrencyGroups } from 'interfaces/user';
import { observer } from 'mobx-react';
import store from 'mobx/stores/workareaStore';
import workareaStore, { WorkspaceDef } from 'mobx/stores/workareaStore';

import messages from 'mobx/stores/messagesStore';
import { MessageBox } from 'components/MessageBox';
import { Toast } from 'components/Toast';
import { getUserFromUrl } from 'utils/getUserFromUrl';

const Workarea: React.FC = (): ReactElement | null => {
  const { recentExecutions } = store;
  const { connected, user } = store;
  const [selectedToClose, setSelectedToClose] = useState<string | null>(null);
  const { CloseWorkspace } = strings;
  const email: string | null = getUserFromUrl();

  useEffect(() => {
    if (email === null)
      return;
    workareaStore.initialize(email);
  }, [email]);

  useEffect(() => {
    if (!user)
      return;
    if (connected) {
      messages.connect(user.email);
    } else {
      messages.disconnect();
    }
  }, [connected, user]);

  const cancelCloseWorkspace = () => setSelectedToClose(null);
  const closeWorkspace = () => {
    store.closeWorkspace(selectedToClose as string);
    // Close the modal window
    setSelectedToClose(null);
  };
  const renderCloseQuestion = () => (
    <QuestionBox {...CloseWorkspace} onYes={closeWorkspace} onNo={cancelCloseWorkspace}/>
  );

  const renderMessage = () => {
    const { recentExecutions } = store;
    const mapTrade = (trade: Message) => (
      <TradeConfirmation userProfile={store.preferences}
                         trade={trade}
                         key={trade.ClOrdID}
                         onClose={store.clearLastExecution}/>
    );
    return (
      <div className={'message-detail'}>
        <div className={'title'}>
          Trade Confirmation
        </div>
        {recentExecutions.map(mapTrade)}
        <div className={'modal-buttons'}>
          <button className={'cancel'} onClick={store.clearLastExecution}>
            Close
          </button>
        </div>
      </div>
    );
  };

  const getActiveWorkspace = () => {
    const { workspaces, user, currentWorkspaceID } = store;
    if (user === null)
      return null;
    return Object.values(workspaces)
      .map(({ id, isDefault }: WorkspaceDef) => {
        return (
          <Workspace
            id={id}
            key={id}
            isDefault={isDefault}
            visible={id === currentWorkspaceID}
            userProfile={store.preferences}
            tenors={store.tenors}
            currencies={store.currencies}
            strategies={store.strategies}
            banks={store.banks}
            connected={store.connected}
            user={user}
            onModify={store.setWorkspaceModified}/>
        );
      });
  };

  const getFooter = () => {
    return (
      <div className={'footer'}>
        <TabBar
          entries={store.workspaces}
          addTab={(group: CurrencyGroups) => store.addWorkspace(group)}
          active={store.currentWorkspaceID}
          setActiveTab={store.setWorkspace}
          onTabClosed={setSelectedToClose}
          onQuit={() => null}
          onWorkspaceRename={store.setWorkspaceName}/>
      </div>
    );
  };

  const renderLoadingModal = (): ReactElement => {
    const message: string = 'We are setting up your preset workspace, this will not take long. Please be patient.';
    return (
      <MessageBox title={'Creating Workspace'}
                  message={message}
                  buttons={() => null}
                  color={'good'}
                  icon={'spinner'}/>

    );
  };

  switch (store.status) {
    case WorkareaStatus.Error:
      return <WorkareaError/>;
    case WorkareaStatus.UserNotFound:
      return <UserNotFound/>;
    case WorkareaStatus.Starting:
      // Should never happen
      return null;
    case WorkareaStatus.Initializing:
      return (
        <div className={'loading-window'}>
          <div className={'spinner'}/>
          <h2>{store.loadingMessage}</h2>
        </div>
      );
    case WorkareaStatus.Ready:
      return (
        <>
          {getActiveWorkspace()}
          {getFooter()}
          <ModalWindow render={renderLoadingModal} visible={store.isCreatingWorkspace}/>
          <ModalWindow render={renderCloseQuestion} visible={!!selectedToClose}/>
          <ModalWindow render={renderMessage} visible={recentExecutions.length > 0}/>
          <Toast message={store.errorMessage} onDismiss={() => store.setError(null)}/>
        </>
      );
    default:
      // Should never happen
      return null;
  }
};

const observed = observer(Workarea);
export { observed as Workarea };
