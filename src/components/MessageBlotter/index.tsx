import messageBlotterColumns, { BlotterTypes } from "columns/messageBlotter";
import { renderRowFactory } from "components/MessageBlotter/helpers";
import { Table } from "components/Table";
import { ColumnSpec } from "components/Table/columnSpecification";
import { observer } from "mobx-react";
import store from "mobx/stores/messagesStore";
import workareaStore from "mobx/stores/workareaStore";
import React, { useMemo } from "react";
import { STRM } from "stateDefs/workspaceState";
import { Message } from "types/message";
import { Role } from "types/role";

interface OwnProps {
  id: string;
  blotterType: BlotterTypes;
  scrollable?: boolean;
  ref?: React.Ref<HTMLDivElement>;
}

type Props = OwnProps;

const MessageBlotter: React.FC<Props> = observer((props: Props) => {
  const { blotterType } = props;
  const messages: Message[] =
    blotterType === BlotterTypes.Executions
      ? store.executions
      : store.myMessages;
  const personality: string = workareaStore.personality;
  const { user } = workareaStore;
  const isBroker: boolean = useMemo((): boolean => {
    const { roles } = user;
    return roles.includes(Role.Broker);
  }, [user]);
  const columnsMap: { [key: string]: ColumnSpec[] } = useMemo(
    () => messageBlotterColumns(blotterType),
    [blotterType]
  );
  const columns: ColumnSpec[] = useMemo(() => {
    return isBroker && personality === STRM
      ? columnsMap.broker
      : columnsMap.normal;
  }, [columnsMap.broker, columnsMap.normal, personality, isBroker]);
  const renderRow = useMemo(() => renderRowFactory(blotterType), [blotterType]);
  return (
    <Table
      id={`${props.id}-tbl`}
      scrollable={!!props.scrollable}
      columns={columns}
      rows={messages}
      renderRow={renderRow}
      allowReorderColumns={true}
    />
  );
});

export { MessageBlotter };
