import { BlotterTypes } from 'columns/messageBlotter';
import { renderRowFactory } from 'components/MessageBlotter/helpers';
import { Table } from 'components/Table';
import { MessageBlotterStore, MessageBlotterStoreContext } from 'mobx/stores/messageBlotterStore';
import { MessagesStore, MessagesStoreContext } from 'mobx/stores/messagesStore';
import workareaStore from 'mobx/stores/workareaStore';
import { observer } from 'mobx-react';
import React, { useMemo } from 'react';
import { FXSymbol } from 'types/FXSymbol';
import { Message } from 'types/message';
import { SortDirection } from 'types/sortDirection';

interface Props {
  readonly id: string;
  readonly blotterType: BlotterTypes;
}

export const MessageBlotter: React.FC<Props> = observer((props: Props): React.ReactElement => {
  const messagesStore: MessagesStore = React.useContext<MessagesStore>(MessagesStoreContext);
  const store = React.useContext<MessageBlotterStore>(MessageBlotterStoreContext);
  const { currencyGroupFilter } = store;
  const { user } = workareaStore;
  const { messages, executions } = messagesStore;
  const { blotterType } = props;

  const filteredExecutions = React.useMemo((): readonly Message[] => {
    const { symbols } = workareaStore;
    if (currencyGroupFilter !== 'All') {
      const filterValue = currencyGroupFilter.toLowerCase();
      const filteredSymbols = symbols.filter(
        ({ ccyGroup }: FXSymbol): boolean => filterValue === ccyGroup.toLowerCase()
      );

      return executions.filter(
        (message: Message): boolean =>
          filteredSymbols.find((symbol: FXSymbol): boolean => {
            return symbol.symbolID === message.Symbol;
          }) !== undefined
      );
    } else {
      return executions;
    }
  }, [currencyGroupFilter, executions]);

  const selectedMessages: readonly Message[] = React.useMemo(
    (): readonly Message[] =>
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
      onFiltered={(columnName: string, keyword: string) => store.filterBy(columnName, keyword)}
      onSortBy={(columnName: string, direction: SortDirection) =>
        store.sortBy(columnName, direction)
      }
      onColumnsOrderChange={(sourceIndex, targetIndex) =>
        store.updateColumnsOrder(sourceIndex, targetIndex)
      }
    />
  );
});
