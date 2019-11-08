import {DefaultWindowButtons} from 'components/DefaultWindowButtons';
import {Table} from 'components/Table';
import {User} from 'interfaces/user';
import React, {useEffect} from 'react';
import columns from 'columns/messageBlotter';
import {connect} from 'react-redux';
import {subscribe, unsubscribe} from 'redux/actions/messageBlotter';
import {ApplicationState} from 'redux/applicationState';
import {SignalRActions} from 'redux/constants/signalRConstants';
import {SignalRAction} from 'redux/signalRAction';
import {MessageBlotterState} from 'redux/stateDefs/messageBlotterState';
import strings from 'locales';

interface DispatchProps {
  subscribe: (email: string) => SignalRAction<SignalRActions>;
  unsubscribe: (email: string) => SignalRAction<SignalRActions>;
}

interface OwnProps {
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
  return (
    <React.Fragment>
      <div className={'window-title-bar'}>
        <h1>{strings.Messages}</h1>
        <DefaultWindowButtons onClose={() => null}/>
      </div>
      <Table columns={columns} rows={props.entries}/>
    </React.Fragment>
  );
});

export {MessageBlotter};
