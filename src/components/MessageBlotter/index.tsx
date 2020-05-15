import messageBlotterColumns, { BlotterTypes } from "columns/messageBlotter";
import { Table } from "components/Table";
import { ColumnSpec } from "components/Table/columnSpecification";
import React, { useMemo } from "react";
import { Message } from "interfaces/message";
import { STRM } from "stateDefs/workspaceState";
import store from "mobx/stores/messagesStore";
import { observer } from "mobx-react";
import workareaStore from "mobx/stores/workareaStore";
import { renderRowFactory } from "components/MessageBlotter/helpers";

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
  const { isbroker } = workareaStore.user;
  const columnsMap: { [key: string]: ColumnSpec[] } = useMemo(
    () => messageBlotterColumns(blotterType),
    [blotterType]
  );
  const columns: ColumnSpec[] = useMemo(() => {
    return isbroker && personality === STRM
      ? columnsMap.broker
      : columnsMap.normal;
  }, [columnsMap.broker, columnsMap.normal, personality, isbroker]);
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
