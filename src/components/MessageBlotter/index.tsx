import messageBlotterColumns from 'columns/messageBlotter';
import { Row, BlotterRowTypes } from 'components/MessageBlotter/row';
import { Table } from 'components/Table';
import { ColumnSpec } from 'components/Table/columnSpecification';
import { User } from 'interfaces/user';
import React, { useMemo, ReactElement } from 'react';
import { BlotterTypes } from 'redux/constants/messageBlotterConstants';
import { Message, ExecTypes } from 'interfaces/message';
import { OrderTypes } from 'interfaces/mdEntry';
import { STRM } from 'redux/stateDefs/workspaceState';
import store from 'mobx/stores/messagesStore';
import { observer } from 'mobx-react';
import workareaStore from 'mobx/stores/workareaStore';

interface OwnProps {
  id: string;
  personality: string;
  connected: boolean;
  blotterType: BlotterTypes;
  user: User;
  scrollable?: boolean;
  ref?: React.Ref<HTMLDivElement>;
}

type Props = OwnProps;
const isExecution = (message: Message): boolean => {
  return (
    message.OrdStatus === ExecTypes.Filled ||
    message.OrdStatus === ExecTypes.PartiallyFilled
  );
};

const renderRowFactory = (blotterType: BlotterTypes, email: string, firm: string) =>
  (props: any): ReactElement | null => {
    const message: Message = props.row;
    const rowType = ((): BlotterRowTypes => {
      if (!isExecution(message)) {
        if (isBusted(message))
          return BlotterRowTypes.Busted;
        return BlotterRowTypes.Normal;
      }
      if (isMyExecution(message, email)) {
        return BlotterRowTypes.MyFill;
      } else if (isMyBankExecution(message, firm)) {
        return BlotterRowTypes.MyBankFill;
      }
      return BlotterRowTypes.Normal;
    })();
    return (
      <Row key={props.key}
           columns={props.columns}
           row={message}
           weight={props.weight}
           type={rowType}
           containerWidth={props.containerWidth}
           totalWidth={props.totalWidth}
           blotterType={blotterType}/>
    );
  };

const isMyBankExecution = (message: Message, firm: string): boolean => {
  const targetUser: string = message.Side === OrderTypes.Ofr ? message.MDMkt : message.ExecBroker;
  return targetUser === firm;
};

const isMyExecution = (message: Message, email: string): boolean => {
  return message.Username === email;
};

const isBusted = (message: Message): boolean => {
  return false;
};

const MessageBlotter: React.FC<Props> = observer((props: Props) => {
  const { blotterType, personality } = props;
  const { entries } = store;
  const user: User | null = workareaStore.user;
  if (user === null)
    throw new Error('cannot create message blotters without at least one authenticated user');
  const { email, isbroker, firm } = user;

  const columnsMap: { [key: string]: ColumnSpec[] } = useMemo(() => messageBlotterColumns(blotterType), [blotterType]);
  const columns: ColumnSpec[] = useMemo(() => {
    return isbroker && personality === STRM
      ? columnsMap.broker
      : columnsMap.normal;
  }, [columnsMap.broker, columnsMap.normal, personality, isbroker]);

  const filtered: Message[] = useMemo(() => {
    const filter = (message: Message): boolean => {
      if (blotterType === BlotterTypes.Executions) {
        return isExecution(message) && message.ContraTrader !== email;
      } else {
        if (isExecution(message))
          return isMyExecution(message, email);
        return true;
      }
    };
    return entries.filter(filter);
  }, [blotterType, email, entries]);

  const renderRow = useMemo(() => renderRowFactory(blotterType, email, firm), [blotterType, email, firm]);
  return (
    <Table scrollable={!!props.scrollable} columns={columns} rows={filtered} renderRow={renderRow}/>
  );
});

export { MessageBlotter };
