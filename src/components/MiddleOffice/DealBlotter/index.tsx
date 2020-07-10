import React, { ReactElement, useEffect, useState } from "react";
import { Table } from "components/Table";
import { columns } from "components/MiddleOffice/DealBlotter/columns";
import { Message } from "interfaces/message";
import { Row, BlotterRowTypes } from "components/MessageBlotter/row";
import { BlotterTypes } from "columns/messageBlotter";
import { observer } from "mobx-react";
import { Deal } from "components/MiddleOffice/interfaces/deal";
import mo from "mobx/stores/moStore";
import { isMessage } from "utils/messageUtils";
import dealsStore from "mobx/stores/dealsStore";
import signalRManager from "signalR/signalRManager";

interface Props {
  id: string;
  onDealSelected: (deal: Deal | null) => void;
}

export const DealBlotter: React.FC<Props> = observer(
  (props: Props): ReactElement | null => {
    const { onDealSelected } = props;
    const [table, setTable] = useState<HTMLDivElement | null>(null);
    const { deal } = mo;
    const deals: Deal[] = dealsStore.deals;
    useEffect(() => {
      signalRManager.addDealListener((deal: Deal) => {
        dealsStore.addDeal(deal);
      });
    }, []);
    const renderRow = (props: any): ReactElement | null => {
      const row: Message | Deal = props.row;
      if (!row) return null;
      const id: string = isMessage(row) ? row.ClOrdID : row.dealID;
      const isSelected = !!deal && deal.dealID === id;
      return (
        <Row
          key={id}
          columns={props.columns}
          row={row}
          weight={props.weight}
          type={BlotterRowTypes.Normal}
          isSelected={isSelected}
          containerWidth={props.containerWidth}
          totalWidth={props.totalWidth}
          blotterType={BlotterTypes.Executions}
          onClick={onDealSelected}
        />
      );
    };
    return (
      <Table
        id={`${props.id}-dblt`}
        columns={columns}
        rows={deals}
        renderRow={renderRow}
        scrollable={true}
        showInsertRow={true}
        ref={setTable}
        allowReorderColumns={true}
      />
    );
  }
);
