import {DefaultWindowButtons} from 'components/DefaultWindowButtons';
import {Table} from 'components/Table';
import {TitleBar, WindowTitle} from 'components/TileTitleBar';
import {User} from 'interfaces/user';
import React, {ReactElement, useEffect} from 'react';
import {MosaicBranch, MosaicWindow} from 'react-mosaic-component';
import columns from 'columns/messageBlotter';
import strings from 'locales';
import {connect} from 'react-redux';
import {subscribe, unsubscribe} from 'redux/actions/messageBlotter';
import {ApplicationState} from 'redux/applicationState';
import {SignalRActions} from 'redux/constants/signalRConstants';
import {SignalRAction} from 'redux/signalRAction';
import {MessageBlotterState} from 'redux/stateDefs/messageBlotterState';

interface DispatchProps {
  subscribe: (email: string) => SignalRAction<SignalRActions>;
  unsubscribe: (email: string) => SignalRAction<SignalRActions>;
}

interface OwnProps {
  path: MosaicBranch[],
  onClose: () => void;
  user: User;
}

const mapStateToProps: ({messageBlotter}: ApplicationState) => MessageBlotterState =
  ({messageBlotter}: ApplicationState): MessageBlotterState => messageBlotter;

const mapDispatchToProps: DispatchProps = {
  subscribe: (email: string) => subscribe(email),
  unsubscribe: (email: string) => unsubscribe(email),
};

const withRedux = connect<MessageBlotterState, DispatchProps, OwnProps, ApplicationState>(
  mapStateToProps,
  mapDispatchToProps,
);

type Props = OwnProps & DispatchProps & MessageBlotterState;
const MessageBlotter: React.FC<OwnProps> = withRedux((props: Props) => {
  const {user, connected} = props;
  useEffect(() => {
    if (connected) {
      props.subscribe(user.email);
    }
    return () => {
      props.unsubscribe(user.email);
    };
  }, [connected, props, user.email]);
  const toolbar: ReactElement = (
    <TitleBar>
      <WindowTitle>{strings.Messages}</WindowTitle>
      <DefaultWindowButtons onClose={props.onClose}/>
    </TitleBar>
  );
  console.log(props.entries);
  return (
    <MosaicWindow<string> title={''} path={props.path} toolbarControls={toolbar}>
      <Table columns={columns} rows={props.entries}/>
    </MosaicWindow>
  );
});

export {MessageBlotter};
