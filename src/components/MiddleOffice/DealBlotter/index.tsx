import React, { ReactElement, useEffect } from "react";
import { Table } from "components/Table";
import { columns } from "components/MiddleOffice/DealBlotter/columns";
import { Message } from "interfaces/message";
import {
  Row,
  BlotterRowTypes,
  ContextMenuItem,
} from "components/MessageBlotter/row";
import { BlotterTypes } from "columns/messageBlotter";
import { observer } from "mobx-react";
import { randomID } from "randomID";
import { DealInsertStore } from "mobx/stores/dealInsertStore";
import { Deal } from "components/MiddleOffice/DealBlotter/deal";
import middleOfficeStore from "mobx/stores/middleOfficeStore";
import { isMessage } from "utils/messageUtils";
import dealsStore from "mobx/stores/dealsStore";
import signalRManager from "signalR/signalRManager";

interface Props {
  id: string;
}

export const DealBlotter: React.FC<Props> = observer(
  (props: Props): ReactElement | null => {
    const deals: Deal[] = dealsStore.deals;
    const onRowClicked = (deal: Deal) => {
      middleOfficeStore.setDeal(deal);
    };
    useEffect(() => {
      signalRManager.addDealListener(dealsStore.addDeal)
    }, []);
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
        const row: Message | Deal = props.row;
        const id: string = isMessage(row) ? row.ClOrdID : row.dealID;
        const isSelected =
          middleOfficeStore.deal !== null && middleOfficeStore.deal === row;
        const contextMenu: ContextMenuItem[] = [
          {
            label: "Clone",
            action: () => {
              console.log("should clone");
            },
          },
        ];
        return (
          <Row
            key={id + randomID("row")}
            columns={props.columns}
            row={row}
            weight={props.weight}
            type={BlotterRowTypes.Normal}
            isSelected={isSelected}
            containerWidth={props.containerWidth}
            totalWidth={props.totalWidth}
            contextMenu={contextMenu}
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
        rows={deals}
        renderRow={renderRow}
        scrollable={true}
        showInsertRow={true}
        allowReorderColumns={true}
      />
    );
  }
);

