import {ModalWindow} from 'components/ModalWindow';
import {Question} from 'components/QuestionBox';
import {TabBar} from 'components/TabBar';
import {Footer} from 'components/Workarea/footer';
import {Workspace} from 'components/Workspace';
import strings from 'locales';
import React, {ReactElement, useEffect, useState} from 'react';
import {connect, MapStateToProps} from 'react-redux';
import {
  addWindow,
  addWorkspaces,
  closeWorkspace,
  initialize,
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
  initialize: initialize,
};

const withRedux: (ignored: any) => any = connect<WorkareaState, DispatchProps, OwnProps, ApplicationState>(
  mapStateToProps,
  mapDispatchToProps,
);

const Workarea: React.FC<OwnProps> = withRedux((props: Props): ReactElement | null => {
  const [selectedToClose, setSelectedToClose] = useState<string | null>(null);
  const {symbols, products, tenors, initialize} = props;
  const {workspaces} = props;
  const {CloseWorkspace} = strings;
  // Active workspace
  const active: string | null = props.activeWorkspace;
  // componentDidMount equivalent
  useEffect((): void => {
    initialize();
  }, [initialize]);

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
      <Workspace id={active} symbols={symbols} products={products} tenors={tenors}/>
    );
  };
  switch (props.status) {
    case WorkareaStatus.Starting:
      // Should never happen
      return null;
    case WorkareaStatus.Initializing:
      return (
        <div className={'loading-window'}>
          <div className={'spinner'}/>
          <h3>Loading, please wait...</h3>
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

