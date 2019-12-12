import {ModalWindow} from 'components/ModalWindow';
import {Question} from 'components/QuestionBox';
import {TabBar} from 'components/TabBar';
import {UserNotFound} from 'components/Workarea/userNotFound';
import {WorkareaError} from 'components/Workarea/workareaError';
import {Workspace} from 'components/Workspace';
import strings from 'locales';
import React, {ReactElement, useEffect, useState} from 'react';
import {connect, MapStateToProps} from 'react-redux';
import {
  addWindow,
  addWorkspaces,
  closeWorkspace,
  initialize,
  loadMessages,
  renameWorkspace,
  setWorkspaces,
} from 'redux/actions/workareaActions';
import {ApplicationState} from 'redux/applicationState';
import {WorkareaState, WorkareaStatus} from 'redux/stateDefs/workareaState';

interface OwnProps {
}

interface DispatchProps {
  addWorkspace: typeof addWorkspaces;
  setWorkspace: typeof setWorkspaces;
  renameWorkspace: typeof renameWorkspace;
  closeWorkspace: typeof closeWorkspace;
  addWindow: typeof addWindow;
  initialize: typeof initialize;
  loadMessages: typeof loadMessages;
}

type Props = OwnProps & WorkareaState & DispatchProps;

const mapStateToProps: MapStateToProps<WorkareaState, OwnProps, ApplicationState> =
  ({workarea}: ApplicationState): WorkareaState => workarea;

const mapDispatchToProps: DispatchProps = {
  addWorkspace: addWorkspaces,
  setWorkspace: setWorkspaces,
  renameWorkspace: renameWorkspace,
  closeWorkspace: closeWorkspace,
  addWindow: addWindow,
  loadMessages: loadMessages,
  initialize: initialize,
};

const withRedux: (ignored: any) => any = connect<WorkareaState, DispatchProps, OwnProps, ApplicationState>(
  mapStateToProps,
  mapDispatchToProps,
);

const Workarea: React.FC<OwnProps> = withRedux((props: Props): ReactElement | null => {
  const [selectedToClose, setSelectedToClose] = useState<string | null>(null);
  const {symbols, products, tenors, initialize} = props;
  const {workspaces, lastInitializationTimestamp, loadMessages} = props;
  const {CloseWorkspace} = strings;
  // Active workspace
  const active: string | null = props.activeWorkspace;
  // componentDidMount equivalent
  useEffect((): void => {
    initialize();
  }, [initialize]);
  useEffect(() => {
    loadMessages(lastInitializationTimestamp);
  }, [loadMessages, lastInitializationTimestamp]);

  const renderCloseQuestion = () => <Question {...CloseWorkspace} onYes={closeWorkspace} onNo={cancelCloseWorkspace}/>;
  const cancelCloseWorkspace = () => setSelectedToClose(null);
  const closeWorkspace = () => {
    props.closeWorkspace(selectedToClose as string);
    // Close the modal window
    setSelectedToClose(null);
  };
  const getActiveWorkspace = (): ReactElement | null => {
    if (active === null)
      return null;
    return (
      <Workspace id={active} symbols={symbols} products={products} tenors={tenors} connected={props.connected}/>
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
        <React.Fragment>
          {getActiveWorkspace()}
          <div className={'footer'}>
            <TabBar
              entries={workspaces}
              addTab={props.addWorkspace}
              setActiveTab={props.setWorkspace}
              onTabClosed={setSelectedToClose}
              onTabRenamed={props.renameWorkspace}
              active={props.activeWorkspace}/>
          </div>
          <ModalWindow render={renderCloseQuestion} visible={!!selectedToClose}/>
        </React.Fragment>
      );
    default:
      // Should never happen
      return null;
  }
});

export {Workarea};

