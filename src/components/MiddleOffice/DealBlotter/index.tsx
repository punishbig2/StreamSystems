import React, { ReactElement, useEffect, useState } from "react";
import { Table } from "components/Table";
import { columns } from "components/MiddleOffice/DealBlotter/columns";
import { Message } from "interfaces/message";
import { Row, BlotterRowTypes } from "components/MessageBlotter/row";
import { BlotterTypes } from "columns/messageBlotter";
import { observer } from "mobx-react";
import { randomID } from "randomID";
import { DealInsertStore } from 'mobx/stores/dealInsertStore';
import { API } from 'API';
import { Deal } from 'components/MiddleOffice/DealBlotter/deal';
import middleOfficeStore from 'mobx/stores/middleOfficeStore';

interface Props {
  id: string;
}

export const DealBlotter: React.FC<Props> = observer(
  (props: Props): ReactElement | null => {
    const [rows, setRows] = useState<Message[]>([]);
    useEffect(() => {
      API.getDeals().then((deals: any) => {
        setRows(deals);
      });
    }, []);
    const onRowClicked = (deal: Deal) => {
      middleOfficeStore.setDeal(deal);
    };
    const renderRow = (props: any): ReactElement | null => {
      if (!props.row) {
        return (
          <Row
            key={"__INSERT_ROW__"}
            columns={props.columns}
            row={null}
            weight={props.weight}
            type={BlotterRowTypes.Normal}
            insertStore={new DealInsertStore()}
            containerWidth={props.containerWidth}
            totalWidth={props.totalWidth}
            blotterType={BlotterTypes.Executions}
          />
        );
      } else {
        const message: Message = props.row;
        return (
          <Row
            key={message.ClOrdID + randomID("row")}
            columns={props.columns}
            row={message}
            weight={props.weight}
            type={BlotterRowTypes.Normal}
            containerWidth={props.containerWidth}
            totalWidth={props.totalWidth}
            insertStore={new DealInsertStore()}
            blotterType={BlotterTypes.Executions}
            onClick={onRowClicked}
          />
        );
      }
    };
    return (
      <Table
        id={`${props.id}-dblt`}
        columns={columns}
        rows={rows}
        renderRow={renderRow}
        scrollable={true}
        showInsertRow={true}
        allowReorderColumns={true}
      />
    );
  }
);
