import messageBlotterColumns from 'columns/messageBlotter';
import {Row, BlotterRowTypes} from 'components/MessageBlotter/row';
import {Table} from 'components/Table';
import {ColumnSpec} from 'components/Table/columnSpecification';
import {User} from 'interfaces/user';
import strings from 'locales';
import React, {useEffect, useMemo} from 'react';
import {connect} from 'react-redux';
import {ApplicationState} from 'redux/applicationState';
import {MessageBlotterState} from 'redux/stateDefs/messageBlotterState';
import {getAuthenticatedUser} from 'utils/getCurrentUser';
import {BlotterTypes} from 'redux/constants/messageBlotterConstants';
import {Message, ExecTypes} from 'interfaces/message';
import {OrderTypes} from 'interfaces/mdEntry';

interface DispatchProps {
}

interface OwnProps {
  // FIXME: add filters and sorting
  setWindowTitle: (id: string, title: string) => void;
  id: string;
  personality: string;
  connected: boolean;
  blotterType: BlotterTypes;
}

const mapStateToProps: ({messageBlotter}: ApplicationState) => MessageBlotterState =
  ({messageBlotter}: ApplicationState): MessageBlotterState => messageBlotter;

const mapDispatchToProps: DispatchProps = {};

const withRedux = connect<MessageBlotterState,
  DispatchProps,
  OwnProps,
  ApplicationState>(
  mapStateToProps,
  mapDispatchToProps,
);

type Props = OwnProps & DispatchProps & MessageBlotterState;
const MessageBlotter: React.FC<OwnProps> = withRedux((props: Props) => {
  const {entries, setWindowTitle, id} = props;

  useEffect(() => {
    setWindowTitle(id, strings.Monitor);
  }, [id, setWindowTitle]);

  const isExecution = (message: Message): boolean => {
    return (
      message.OrdStatus === ExecTypes.Filled ||
      message.OrdStatus === ExecTypes.PartiallyFilled
    );
  };

  const isMyBankExecution = (message: Message): boolean => {
    const targetUser: string =
      message.Side === OrderTypes.Ofr ? message.MDMkt : message.ExecBroker;
    return targetUser === user.firm;
  };

  const isMyExecution = (message: Message): boolean => {
    return message.Username === user.email;
  };

  const isBusted = (message: Message): boolean => {
    return false;
  };

  const renderRow = (props: any) => {
    const message: Message = props.row;
    const rowType = ((): BlotterRowTypes => {
      if (!isExecution(message)) {
        if (isBusted(message)) return BlotterRowTypes.Busted;
        return BlotterRowTypes.Normal;
      }
      if (isMyExecution(message)) {
        return BlotterRowTypes.MyFill;
      } else if (isMyBankExecution(message)) {
        return BlotterRowTypes.MyBankFill;
      }
      return BlotterRowTypes.Normal;
    })();
    return (
      <Row
        key={props.key}
        columns={props.columns}
        row={message}
        weight={props.weight}
        type={rowType}
      />
    );
  };

  const user: User = getAuthenticatedUser();
  const columnsMap: { [key: string]: ColumnSpec[] } = messageBlotterColumns(
    props.blotterType,
  );
  const columns: ColumnSpec[] = useMemo(() => {
    return user.isbroker && props.personality === 'None'
      ? columnsMap.broker
      : columnsMap.normal;
  }, [columnsMap.broker, columnsMap.normal, props.personality, user.isbroker]);

  const baseFilter = (message: Message): boolean => {
    if (props.blotterType === BlotterTypes.Fills) {
      return isExecution(message);
    } else {
      if (isExecution(message)) {
        return isMyExecution(message);
      }
      return true;
    }
  };
  return (
    <>
      <div className={'window-title-bar'}>
        <h1>{strings.Messages}</h1>
      </div>
      <div className={'window-content'}>
        <Table
          scrollable={true}
          columns={columns}
          rows={entries.filter(baseFilter)}
          renderRow={renderRow}
        />
      </div>
    </>
  );
});

export {MessageBlotter};
