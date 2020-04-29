import React, { ReactElement } from 'react';
import { Table } from 'components/Table';
import { columns } from 'components/MiddleOffice/DealBlotter/columns';
import messagesStore from 'mobx/stores/messagesStore';
import { Message } from 'interfaces/message';
import { Row, BlotterRowTypes } from 'components/MessageBlotter/row';
import { BlotterTypes } from 'columns/messageBlotter';
import { getLink } from 'messageUtils';
import { observer } from 'mobx-react';
import { randomID } from 'randomID';

interface Props {
  id: string;
}

export const DealBlotter: React.FC<Props> = observer((props: Props): ReactElement | null => {
  const rows: Message[] = messagesStore.systemExecutions;
  const renderRow = (props: any): ReactElement | null => {
    const message: Message = props.row;
    return (
      <Row key={getLink(message) + randomID('row')}
           columns={props.columns}
           row={message}
           weight={props.weight}
           type={BlotterRowTypes.Normal}
           containerWidth={props.containerWidth}
           totalWidth={props.totalWidth}
           blotterType={BlotterTypes.Executions}/>
    );
  };
  return <Table id={`${props.id}-dblt`}
                columns={columns}
                rows={rows}
                renderRow={renderRow}
                scrollable={true}
                allowReorderColumns={true}/>;
});
