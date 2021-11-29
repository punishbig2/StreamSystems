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
import { Symbol } from "types/symbol";

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
  const { currencyGroupFilter } = store;
  const { user } = workareaStore;
  const { messages, executions } = messagesStore;
  const { blotterType } = props;

  const filteredExecutions = React.useMemo((): ReadonlyArray<Message> => {
    const { symbols } = workareaStore;
    if (currencyGroupFilter !== "All") {
      const filterValue = currencyGroupFilter.toLowerCase();
      const filteredSymbols = symbols.filter(
        ({ ccyGroup }: Symbol): boolean =>
          filterValue === ccyGroup.toLowerCase()
      );

      return executions.filter(
        (message: Message): boolean =>
          filteredSymbols.find((symbol: Symbol): boolean => {
            return symbol.symbolID === message.Symbol;
          }) !== undefined
      );
    } else {
      return executions;
    }
  }, [currencyGroupFilter, executions]);

  const selectedMessages: ReadonlyArray<Message> = React.useMemo(
    (): ReadonlyArray<Message> =>
      blotterType === BlotterTypes.Executions ? filteredExecutions : messages,
    [blotterType, filteredExecutions, messages]
  );

  const renderRow = useMemo(() => renderRowFactory(blotterType), [blotterType]);

  React.useEffect((): void => {
    store.setOwner(user);
    store.setRows(selectedMessages);
  }, [store, messages, user, selectedMessages]);

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
