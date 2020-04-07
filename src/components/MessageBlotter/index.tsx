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
import store from 'mobx/stores/messages';
import { observer } from 'mobx-react';

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
const MessageBlotter: React.FC<Props> = observer(
  React.forwardRef((props: Props, ref: React.Ref<HTMLDivElement>) => {
    const { user, blotterType } = props;
    const { entries } = store;

    const isExecution = (message: Message): boolean => {
      return (
        message.OrdStatus === ExecTypes.Filled ||
        message.OrdStatus === ExecTypes.PartiallyFilled
      );
    };

    const isMyBankExecution = (message: Message): boolean => {
      const targetUser: string = message.Side === OrderTypes.Ofr ? message.MDMkt : message.ExecBroker;
      return targetUser === user.firm;
    };

    const isMyExecution = (message: Message): boolean => {
      return message.Username === user.email;
    };

    const isBusted = (message: Message): boolean => {
      return false;
    };

    const renderRow = (props: any): ReactElement | null => {
      const message: Message = props.row;
      const rowType = ((): BlotterRowTypes => {
        if (!isExecution(message)) {
          if (isBusted(message))
            return BlotterRowTypes.Busted;
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

    const columnsMap: { [key: string]: ColumnSpec[] } = messageBlotterColumns(
      props.blotterType,
    );

    const columns: ColumnSpec[] = useMemo(() => {
      return user.isbroker && props.personality === STRM
        ? columnsMap.broker
        : columnsMap.normal;
    }, [columnsMap.broker, columnsMap.normal, props.personality, user.isbroker]);

    const baseFilter = (message: Message): boolean => {
      if (props.blotterType === BlotterTypes.Executions) {
        return isExecution(message) && message.ContraTrader !== user.email;
      } else {
        if (isExecution(message))
          return isMyExecution(message);
        return true;
      }
    };

    return (
      <Table ref={ref}
             scrollable={!!props.scrollable}
             columns={columns}
             rows={entries.filter(baseFilter)}
             renderRow={renderRow}/>
    );
  }),
);

export { MessageBlotter };
