import {ModalWindow} from 'components/ModalWindow';
import {Question} from 'components/QuestionBox';
import {Footer} from 'components/Workarea/footer';
import {TabBar} from 'components/TabBar';
import {Workspace} from 'components/Workspace';
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
import {WorkareaState} from 'redux/stateDefs/workareaState';
import {ApplicationState} from 'redux/applicationState';
import strings from 'locales';

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

const Workarea: React.FC<OwnProps> = withRedux((props: Props): ReactElement => {
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
  if (symbols.length === 0)
    return <div/>;
  const getActiveWorkspace = (): ReactElement | null => {
    if (active === null)
      return null;
    return (
      <Workspace
        id={active}
        user={props.user}
        // Data
        symbols={symbols}
        products={products}
        tenors={tenors}/>
    );
  };

  return (
    <React.Fragment>
      {getActiveWorkspace()}
      <Footer>
        <TabBar
          entries={workspaces}
          addTab={props.addWorkspace}
          setActiveTab={props.setWorkspace}
          onTabClosed={setSelectedToClose}
          onTabRenamed={props.renameWorkspace}
          active={props.activeWorkspace}/>
      </Footer>
      <ModalWindow render={renderCloseQuestion} visible={!!selectedToClose}/>
    </React.Fragment>
  );
});

export {Workarea};

