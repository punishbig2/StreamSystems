import { BlotterTypes } from "columns/messageBlotter";
import { renderRowFactory } from "components/MessageBlotter/helpers";
import { Table } from "components/Table";
import { observer } from "mobx-react";
import {
  MessageBlotterStore,
  MessageBlotterStoreContext,
} from "mobx/stores/messageBlotterStore";
import { MessagesStore, MessagesStoreContext } from "mobx/stores/messagesStore";
import workareaStore from "mobx/stores/workareaStore";
import React, { useMemo } from "react";
import { Message } from "types/message";
import { SortDirection } from "types/sortDirection";

interface OwnProps {
  id: string;
  blotterType: BlotterTypes;
}

type Props = OwnProps;

export const MessageBlotter: React.FC<Props> = observer((props: Props) => {
  const messagesStore: MessagesStore =
    React.useContext<MessagesStore>(MessagesStoreContext);
  const store = React.useContext<MessageBlotterStore>(
    MessageBlotterStoreContext
  );
  const { user } = workareaStore;
  const { executions, myMessages } = messagesStore;
  const { blotterType } = props;

  const messages: ReadonlyArray<Message> = React.useMemo(
    (): ReadonlyArray<Message> =>
      blotterType === BlotterTypes.Executions ? executions : myMessages,
    [blotterType, executions, myMessages]
  );

  const renderRow = useMemo(() => renderRowFactory(blotterType), [blotterType]);

  React.useEffect((): void => {
    store.setOwner(user);
    store.setRows(messages);
  }, [store, messages, user]);

  return (
    <Table
      columns={store.columns}
      rows={store.rows}
      renderRow={renderRow}
      allowReorderColumns={true}
      onFiltered={(columnName: string, keyword: string) =>
        store.filterBy(columnName, keyword)
      }
      onSortBy={(columnName: string, direction: SortDirection) =>
        store.sortBy(columnName, direction)
      }
      onColumnsOrderChange={(sourceIndex, targetIndex) =>
        store.updateColumnsOrder(sourceIndex, targetIndex)
      }
    />
  );
});
