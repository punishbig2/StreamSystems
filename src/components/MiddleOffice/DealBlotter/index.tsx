import { BlotterTypes } from "columns/messageBlotter";
import { BlotterRowTypes, Row } from "components/MessageBlotter/row";
import { columns } from "components/MiddleOffice/DealBlotter/columns";
import { Deal } from "components/MiddleOffice/interfaces/deal";
import { Table } from "components/Table";
import { Message } from "interfaces/message";
import { observer } from "mobx-react";
import dealsStore from "mobx/stores/dealsStore";
import moStore from "mobx/stores/moStore";
import React, { ReactElement, useEffect, useState } from "react";
import signalRManager from "signalR/signalRManager";
import { isMessage } from "utils/messageUtils";

interface Props {
  id: string;
  disabled: boolean;
  onDealSelected: (deal: Deal | null) => void;
}

export const DealBlotter: React.FC<Props> = observer(
  (props: Props): ReactElement | null => {
    const { onDealSelected } = props;
    const [, setTable] = useState<HTMLDivElement | null>(null);
    const { deal } = moStore;
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
        id={`${props.id}-deal-blotter`}
        columns={columns}
        rows={deals}
        renderRow={renderRow}
        scrollable={true}
        showInsertRow={true}
        ref={setTable}
        allowReorderColumns={true}
        className={props.disabled ? "disabled" : undefined}
      />
    );
  }
);
