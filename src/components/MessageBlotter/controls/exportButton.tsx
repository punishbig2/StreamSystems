import { BlotterTypes } from 'columns/messageBlotter';
import { ExtendedTableColumn } from 'components/Table/tableColumn';
import { MessageBlotterStore, MessageBlotterStoreContext } from 'mobx/stores/messageBlotterStore';
import { MessagesStore, MessagesStoreContext } from 'mobx/stores/messagesStore';
import React from 'react';
import { Message } from 'types/message';

interface Props {
  readonly blotterType: BlotterTypes;
}

export const ExportButton: React.FC<Props> = (props: Props): React.ReactElement => {
  const { blotterType } = props;
  const store = React.useContext<MessageBlotterStore>(MessageBlotterStoreContext);
  const messagesStore = React.useContext<MessagesStore>(MessagesStoreContext);

  const exportToCSV = React.useCallback(
    async (event: React.MouseEvent): Promise<void> => {
      event.stopPropagation();
      const { body } = document;
      const messages =
        blotterType === BlotterTypes.Executions ? messagesStore.executions : messagesStore.messages;

      const csv = messages
        .map((row: Message): string => {
          return store.columns
            .map((column: ExtendedTableColumn): string => {
              const value = column.value?.({ message: row });
              if (!value) {
                return '';
              }

              return `"${value}"`;
            })
            .join(',');
        })
        .join('\r\n');

      const file = new Blob([csv], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(file);
      const link = document.createElement('a');

      link.style.visibility = 'hidden';
      body.append(link);

      link.setAttribute('href', url);
      link.setAttribute('download', blotterType + '-content.csv');
      link.click();

      link.remove();
    },
    [blotterType, messagesStore.executions, messagesStore.messages, store.columns]
  );

  return (
    <div className="blotter-export-button" onClick={exportToCSV}>
      Export to CSV
    </div>
  );
};
