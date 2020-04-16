import messageBlotterColumns, { BlotterTypes } from 'columns/messageBlotter';
import { Table } from 'components/Table';
import { ColumnSpec } from 'components/Table/columnSpecification';
import { User } from 'interfaces/user';
import React, { useMemo } from 'react';
import { Message } from 'interfaces/message';
import { STRM } from 'stateDefs/workspaceState';
import store from 'mobx/stores/messagesStore';
import { observer } from 'mobx-react';
import workareaStore from 'mobx/stores/workareaStore';
import { isMyMessage, renderRowFactory } from 'components/MessageBlotter/helpers';

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

const MessageBlotter: React.FC<Props> = observer((props: Props) => {
  const { blotterType, personality } = props;
  const entries: Message[] = blotterType === BlotterTypes.Executions ? store.executions : store.entries;
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

  const renderRow = useMemo(() => renderRowFactory(blotterType, email, firm), [blotterType, email, firm]);
  return (
    <Table scrollable={!!props.scrollable} columns={columns} rows={entries} renderRow={renderRow}/>
  );
});

export { MessageBlotter };
