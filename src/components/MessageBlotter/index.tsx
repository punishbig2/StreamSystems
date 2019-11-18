import {Row} from 'components/MessageBlotter/row';
import {ModalWindow} from 'components/ModalWindow';
import {DialogButtons} from 'components/PullRight';
import {Table} from 'components/Table';
import {ColumnSpec} from 'components/Table/columnSpecification';
import React, {useEffect} from 'react';
import columns from 'columns/messageBlotter';
import {connect} from 'react-redux';
import {clearLastEntry, subscribe, unsubscribe} from 'redux/actions/messageBlotterActions';
import {ApplicationState} from 'redux/applicationState';
import {SignalRActions} from 'redux/constants/signalRConstants';
import {SignalRAction} from 'redux/signalRAction';
import {MessageBlotterState} from 'redux/stateDefs/messageBlotterState';
import strings from 'locales';
import {getAuthenticatedUser} from 'utils/getCurrentUser';

interface DispatchProps {
  clearLastEntry: () => void;
  subscribe: (email: string) => SignalRAction<SignalRActions>;
  unsubscribe: (email: string) => SignalRAction<SignalRActions>;
}

interface OwnProps {
  // FIXME: add filters and sorting
}

const mapStateToProps: ({messageBlotter}: ApplicationState) => MessageBlotterState =
  ({messageBlotter}: ApplicationState): MessageBlotterState => messageBlotter;

const mapDispatchToProps: DispatchProps = {
    clearLastEntry: () => clearLastEntry(),
    subscribe: (email: string) => subscribe(email),
    unsubscribe: (email: string) => unsubscribe(email),
  }
;

const withRedux = connect<MessageBlotterState, DispatchProps, OwnProps, ApplicationState>(
  mapStateToProps,
  mapDispatchToProps,
);

type Props = OwnProps & DispatchProps & MessageBlotterState;
const MessageBlotter: React.FC<OwnProps> = withRedux((props: Props) => {
  const {connected, subscribe, unsubscribe, entries} = props;
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
  const renderRow = (props: any) => <Row {...props}/>;
  const renderMessage = () => {
    if (!props.lastEntry)
      return null;
    return (
      <div className={'message-detail'}>
        {columns.map((column: ColumnSpec) => (
          <div className={'message-entry'} key={column.name}>
            <span className={'message-entry-label'}>{column.header({})}</span>
            <span className={'message-entry-value'}>{column.render(props.lastEntry)}</span>
          </div>
        ))}
        <DialogButtons>
          <button onClick={props.clearLastEntry}>Close</button>
        </DialogButtons>
      </div>
    );
  };
  return (
    <React.Fragment>
      <div className={'window-title-bar'}>
        <h1>{strings.Messages}</h1>
      </div>
      <div className={'window-content'}>
        <Table columns={columns} rows={entries} renderRow={renderRow}/>
      </div>
      <ModalWindow render={() => renderMessage()} visible={props.lastEntry !== null}/>
    </React.Fragment>
  );
});

export {MessageBlotter};