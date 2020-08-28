import { Cell } from "components/Table/Cell";
import { ColumnSpec } from "components/Table/columnSpecification";
import { RowFunctions } from "components/PodTile/rowFunctions";
import React, { useState, useEffect } from "react";
import { getCellWidth } from "components/Table/helpers";
import { PodRowStore } from "mobx/stores/podRowStore";
import { observer } from "mobx-react";
import { PodRowStatus } from "types/podRow";

interface OwnProps {
  readonly id: string;
  readonly columns: ColumnSpec[];
  readonly weight: number;
  readonly rowNumber: number;
  readonly defaultSize: number;
  readonly minimumSize: number;
  readonly connected: boolean;
  readonly onTenorSelected: (tenor: string) => void;

  readonly [key: string]: any;
}

type Props = OwnProps & RowFunctions;

export const Row: React.FC<Props> = observer((props: Props) => {
  const [store] = useState<PodRowStore>(
    new PodRowStore(props.currency, props.strategy, props.tenor)
  );
  const { id, columns, row, totalWidth, containerWidth, ...rowProps } = props;
  // Three identifying props
  // const { currency, strategy, tenor } = rowProps;
  const { internalRow } = store;
  const classes: string[] = ["tr"];

  // FIXME: remove this and rely on the orders always
  // useWListener(currency, strategy, tenor, store);
  useEffect(() => {
    store.setInternalRow(row);
  }, [store, row]);

  if (internalRow.status !== PodRowStatus.Normal) classes.push("error");
  return (
    <div className={classes.join(" ")} data-row-number={props.rowNumber}>
      {columns.map((column: ColumnSpec, index: number) => {
        const width: string = getCellWidth(
          column.width,
          totalWidth,
          containerWidth
        );
        const name: string = column.name;
        return (
          <Cell
            key={name}
            render={column.render}
            className={column.className}
            colNumber={index}
            width={width}
            rowStore={store}
            {...rowProps}
            {...internalRow}
          />
        );
      })}
    </div>
  );
});
