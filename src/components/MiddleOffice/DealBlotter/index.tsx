import { columns } from "components/MiddleOffice/DealBlotter/columns";
import { DealRow, RowProps } from "components/MiddleOffice/DealBlotter/row";
import { Deal } from "components/MiddleOffice/types/deal";
import { Table } from "components/Table";
import { defaultTableColumnStateMapper } from "components/Table/tableColumn";
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
        columns={columns.map(defaultTableColumnStateMapper)}
        rows={deals}
        renderRow={(props: RowProps): ReactElement => (
          <DealRow key={props.row.id} {...props} onClick={onDealSelected} />
        )}
        selectedRow={props.selectedRow}
        ref={setTable}
        allowReorderColumns={true}
        className={props.disabled ? "disabled" : undefined}
      />
    );
  },
  (prevProps: Props, nextProps: Props) => {
    if (prevProps.selectedRow !== nextProps.selectedRow) return false;
    if (prevProps.disabled !== nextProps.disabled) return false;
    return deepEqual(prevProps.deals, nextProps.deals);
  }
);
