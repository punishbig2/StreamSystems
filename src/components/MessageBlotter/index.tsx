import {Row} from 'components/MessageBlotter/row';
import {Table} from 'components/Table';
import React, {useEffect} from 'react';
import columns from 'columns/messageBlotter';
import {connect} from 'react-redux';
import {Action} from 'redux/action';
import {subscribe, unsubscribe, getSnapshot} from 'redux/actions/messageBlotterActions';
import {ApplicationState} from 'redux/applicationState';
import {SignalRActions} from 'redux/constants/signalRConstants';
import {SignalRAction} from 'redux/signalRAction';
import {MessageBlotterState} from 'redux/stateDefs/messageBlotterState';
import strings from 'locales';
import {getAuthenticatedUser} from 'utils/getCurrentUser';

interface DispatchProps {
  subscribe: (email: string) => SignalRAction<SignalRActions>;
  unsubscribe: (email: string) => SignalRAction<SignalRActions>;
  initialize: () => Action;
}

interface OwnProps {
  // FIXME: add filters and sorting
}

const mapStateToProps: ({messageBlotter}: ApplicationState) => MessageBlotterState =
  ({messageBlotter}: ApplicationState): MessageBlotterState => messageBlotter;

const mapDispatchToProps: DispatchProps = {
    subscribe: (email: string) => subscribe(email),
    unsubscribe: (email: string) => unsubscribe(email),
    initialize: getSnapshot,
  }
;

const withRedux = connect<MessageBlotterState, DispatchProps, OwnProps, ApplicationState>(
  mapStateToProps,
  mapDispatchToProps,
);

type Props = OwnProps & DispatchProps & MessageBlotterState;
const MessageBlotter: React.FC<OwnProps> = withRedux((props: Props) => {
  const {connected, subscribe, unsubscribe} = props;
  // Get the user directly from the store
  const {email} = getAuthenticatedUser();
  useEffect(() => {
    if (connected) {
      subscribe(email);
      return () => {
        unsubscribe(email);
      };
    }
  }, [connected, subscribe, unsubscribe, email]);
  useEffect(() => {
    props.initialize();
  }, []);
  const renderRow = (props: any) => {
    return <Row {...props}/>;
  };
  return (
    <React.Fragment>
      <div className={'window-title-bar'}>
        <h1>{strings.Messages}</h1>
      </div>
      <div className={'window-content'}>
        <Table columns={columns} rows={props.entries} renderRow={renderRow}/>
      </div>
    </React.Fragment>
  );
});

export {MessageBlotter};
