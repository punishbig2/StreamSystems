import messageBlotterColumns from 'columns/messageBlotter';
import {ModalWindow} from 'components/ModalWindow';
import {QuestionBox} from 'components/QuestionBox';
import {TabBar} from 'components/TabBar';
import {ColumnSpec} from 'components/Table/columnSpecification';
import {UserNotFound} from 'components/Workarea/userNotFound';
import {WorkareaError} from 'components/Workarea/workareaError';
import {Workspace} from 'components/Workspace';
import strings from 'locales';
import React, {ReactElement, useEffect, useState} from 'react';
import {connect, MapStateToProps} from 'react-redux';
import {BlotterTypes} from 'redux/constants/messageBlotterConstants';
import {AnyAction} from 'redux';
import {
  addWindow,
  addWorkspace,
  clearLastExecution,
  closeWorkspace,
  initialize,
  loadMessages,
  quit,
  renameWorkspace,
  setWorkspace,
  subscribeToMessages,
  unsubscribeFromMessages,
} from 'redux/actions/workareaActions';
import {ApplicationState} from 'redux/applicationState';
import {WindowTypes} from 'redux/constants/workareaConstants';
import {WorkareaState, WorkareaStatus} from 'redux/stateDefs/workareaState';

interface OwnProps {
}

interface DispatchProps {
  addWorkspace: () => AnyAction;
  setWorkspace: (id: string) => AnyAction;
  renameWorkspace: (name: string, id: string) => AnyAction;
  closeWorkspace: (id: string) => AnyAction;
  addWindow: (type: WindowTypes, id: string) => AnyAction;
  initialize: () => AnyAction;
  loadMessages: (useremail: string) => AnyAction;
  quit: () => void;
  clearLastExecution: () => void;
  unsubscribeFromMessages: (email: string) => void;
  subscribeToMessages: (email: string) => void;
}

type Props = OwnProps & WorkareaState & DispatchProps;

const mapStateToProps: MapStateToProps<WorkareaState,
  OwnProps,
  ApplicationState> = ({workarea}: ApplicationState): WorkareaState => workarea;

const mapDispatchToProps: DispatchProps = {
  addWorkspace,
  setWorkspace,
  clearLastExecution,
  renameWorkspace,
  closeWorkspace,
  addWindow,
  loadMessages,
  initialize,
  quit,
  unsubscribeFromMessages,
  subscribeToMessages,
};

const withRedux: (ignored: any) => any = connect<WorkareaState,
  DispatchProps,
  OwnProps,
  ApplicationState>(
  mapStateToProps,
  mapDispatchToProps,
);

const Workarea: React.FC<OwnProps> = withRedux(
  (props: Props): ReactElement | null => {
    const {
      symbols,
      products,
      tenors,
      banks,
      initialize,
      connected,
      user,
      activeWorkspace,
    } = props;
    const [selectedToClose, setSelectedToClose] = useState<string | null>(null);
    const {workspaces, loadMessages} = props;
    const {CloseWorkspace} = strings;
    const {subscribeToMessages, unsubscribeFromMessages} = props;

    useEffect(() => {
      if (!user) return;
      subscribeToMessages(user.email);
      return () => {
        unsubscribeFromMessages(user.email);
      };
    }, [subscribeToMessages, unsubscribeFromMessages, connected, user]);

    useEffect(() => {
      initialize();
    }, [initialize]);

    useEffect((): void => {
      if (user) {
        loadMessages(user.email);
      }
    }, [user, loadMessages]);

    const renderCloseQuestion = () => (
      <QuestionBox
        {...CloseWorkspace}
        onYes={closeWorkspace}
        onNo={cancelCloseWorkspace}
      />
    );
    const cancelCloseWorkspace = () => setSelectedToClose(null);
    const closeWorkspace = () => {
      props.closeWorkspace(selectedToClose as string);
      // Close the modal window
      setSelectedToClose(null);
    };

    const renderMessage = () => {
      if (!props.lastExecution) return null;
      const columns: ColumnSpec[] = messageBlotterColumns(BlotterTypes.Regular)
        .normal;
      return (
        <div className={'message-detail'}>
          <audio src={'/sounds/alert.wav'} autoPlay={true}/>
          {columns.map((column: ColumnSpec) => (
            <div className={'message-entry'} key={column.name}>
              <div className={'message-entry-label'}>{column.header({})}</div>
              <div className={'message-entry-value'}>
                {column.render(props.lastExecution)}
              </div>
            </div>
          ))}
          <div className={'modal-buttons'}>
            <button className={'cancel'} onClick={props.clearLastExecution}>
              Close
            </button>
          </div>
        </div>
      );
    };

    switch (props.status) {
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
            <h2>{props.message}</h2>
          </div>
        );
      case WorkareaStatus.Ready:
        return (
          <>
            {activeWorkspace ? (
              <Workspace
                id={activeWorkspace}
                symbols={symbols}
                products={products}
                tenors={tenors}
                banks={banks}
                connected={connected}
              />
            ) : null}
            <div className={'footer'}>
              <TabBar
                entries={workspaces}
                addTab={props.addWorkspace}
                active={activeWorkspace}
                setActiveTab={props.setWorkspace}
                onTabClosed={setSelectedToClose}
                onTabRenamed={props.renameWorkspace}
                onQuit={props.quit}
              />
            </div>
            <ModalWindow
              render={renderCloseQuestion}
              visible={!!selectedToClose}
            />
            <ModalWindow
              render={() => renderMessage()}
              visible={props.lastExecution !== null}
            />
          </>
        );
      default:
        // Should never happen
        return null;
    }
  },
);

export {Workarea};
