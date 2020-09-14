import { BlotterTypes } from "columns/messageBlotter";
import { BlotterRowTypes, Row } from "components/MessageBlotter/row";
import { columns } from "components/MiddleOffice/DealBlotter/columns";
import { Deal } from "components/MiddleOffice/types/deal";
import { Table } from "components/Table";
import React, { ReactElement, useState } from "react";
import { Message } from "types/message";
import { isMessage } from "utils/messageUtils";

interface Props {
  readonly id: string;
  readonly disabled: boolean;
  readonly deals: ReadonlyArray<Deal>;
  readonly onDealSelected: (deal: Deal | null) => void;
  readonly selectedRow: string | null;
}

export const DealBlotter: React.FC<Props> = (
  props: Props
): ReactElement | null => {
  const { deals } = props;
  const { onDealSelected } = props;
  const [, setTable] = useState<HTMLDivElement | null>(null);
  const renderRow = (props: any): ReactElement | null => {
    const row: Message | Deal = props.row;
    if (!row) return null;
    if (isMessage(row)) throw new Error("this renderer is for deals only");
    return (
      <Row
        key={row.id}
        columns={props.columns}
        row={row}
        weight={props.weight}
        type={BlotterRowTypes.Normal}
        selected={props.selected}
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
      selectedRow={props.selectedRow}
      scrollable={true}
      ref={setTable}
      allowReorderColumns={true}
      className={props.disabled ? "disabled" : undefined}
    />
  );
};
