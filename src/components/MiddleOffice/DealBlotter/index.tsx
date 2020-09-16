import { columns } from "components/MiddleOffice/DealBlotter/columns";
import { DealRow, RowProps } from "components/MiddleOffice/DealBlotter/row";
import { Deal } from "components/MiddleOffice/types/deal";
import { Table } from "components/Table";
import deepEqual from "deep-equal";
import React, { ReactElement, useState } from "react";

interface Props {
  readonly id: string;
  readonly disabled: boolean;
  readonly deals: ReadonlyArray<Deal>;
  readonly onDealSelected: (deal: Deal | null) => void;
  readonly selectedRow: string | null;
}

export const DealBlotter: React.FC<Props> = React.memo(
  (props: Props): ReactElement | null => {
    const { deals } = props;
    const { onDealSelected } = props;
    const [, setTable] = useState<HTMLDivElement | null>(null);
    return (
      <Table
        id={`${props.id}-deal-blotter`}
        columns={columns}
        rows={deals}
        renderRow={(props: RowProps): ReactElement => (
          <DealRow key={props.row.id} {...props} onClick={onDealSelected} />
        )}
        selectedRow={props.selectedRow}
        scrollable={true}
        ref={setTable}
        allowReorderColumns={true}
        className={props.disabled ? "disabled" : undefined}
      />
    );
  },
  (prevProps: Props, nextProps: Props) => {
    if (prevProps.selectedRow !== nextProps.selectedRow) return false;
    return deepEqual(prevProps.deals, nextProps.deals);
  }
);
