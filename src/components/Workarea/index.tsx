import {ModalWindow} from 'components/ModalWindow';
import {Question} from 'components/QuestionBox';
import {TabBar} from 'components/TabBar';
import {UserNotFound} from 'components/Workarea/userNotFound';
import {WorkareaError} from 'components/Workarea/workareaError';
import {Workspace} from 'components/Workspace';
import strings from 'locales';
import React, {ReactElement, useEffect, useState} from 'react';
import {connect, MapStateToProps} from 'react-redux';
import {AnyAction} from 'redux';
import {
  addWindow,
  addWorkspaces,
  closeWorkspace,
  initialize,
  loadMessages,
  quit,
  renameWorkspace,
  setWorkspaces,
} from 'redux/actions/workareaActions';
import {ApplicationState} from 'redux/applicationState';
import {WindowTypes} from 'redux/constants/workareaConstants';
import {WorkareaState, WorkareaStatus} from 'redux/stateDefs/workareaState';

interface OwnProps {
}

interface DispatchProps {
  addWorkspace: () => AnyAction;
  setWorkspace: (id: string) => AnyAction;
  renameWorkspace: (name: string, id: string) => AnyAction
  closeWorkspace: (id: string) => AnyAction;
  addWindow: (type: WindowTypes, id: string) => AnyAction;
  initialize: () => AnyAction;
  loadMessages: (timestamp?: string) => AnyAction;
  quit: () => void;
}

type Props = OwnProps & WorkareaState & DispatchProps;

const mapStateToProps: MapStateToProps<WorkareaState, OwnProps, ApplicationState> =
  ({workarea}: ApplicationState): WorkareaState => workarea;

const mapDispatchToProps: DispatchProps = {
  addWorkspace: addWorkspaces,
  setWorkspace: setWorkspaces,
  renameWorkspace,
  closeWorkspace,
  addWindow,
  loadMessages,
  initialize,
  quit,
};

const withRedux: (ignored: any) => any = connect<WorkareaState, DispatchProps, OwnProps, ApplicationState>(
  mapStateToProps,
  mapDispatchToProps,
);

const Workarea: React.FC<OwnProps> = withRedux((props: Props): ReactElement | null => {
  const {symbols, products, tenors, initialize, connected, activeWorkspace} = props;
  const [selectedToClose, setSelectedToClose] = useState<string | null>(null);
  const {workspaces, loadMessages} = props;
  const {CloseWorkspace} = strings;
  // componentDidMount equivalent
  useEffect((): void => {
    initialize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    const now: string = (Date.now() / 1000).toFixed(0);
    loadMessages(now);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const renderCloseQuestion = () => <Question {...CloseWorkspace} onYes={closeWorkspace} onNo={cancelCloseWorkspace}/>;
  const cancelCloseWorkspace = () => setSelectedToClose(null);
  const closeWorkspace = () => {
    props.closeWorkspace(selectedToClose as string);
    // Close the modal window
    setSelectedToClose(null);
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
          {activeWorkspace
            ? <Workspace id={activeWorkspace} symbols={symbols} products={products} tenors={tenors}
                         connected={connected}/>
            : null}
          <div className={'footer'}>
            <TabBar
              entries={workspaces}
              addTab={props.addWorkspace}
              active={activeWorkspace}
              setActiveTab={props.setWorkspace}
              onTabClosed={setSelectedToClose}
              onTabRenamed={props.renameWorkspace}
              onQuit={props.quit}/>
          </div>
          <ModalWindow render={renderCloseQuestion} visible={!!selectedToClose}/>
        </>
      );
    default:
      // Should never happen
      return null;
  }
});

export {Workarea};

