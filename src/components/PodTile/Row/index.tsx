import { RowFunctions } from "components/PodTile/rowFunctions";
import { Cell } from "components/Table/Cell";
import { TableColumn } from "components/Table/tableColumn";
import { getCellWidth } from "components/Table/helpers";
import { observer } from "mobx-react";
import { PodRowStore } from "mobx/stores/podRowStore";
import React, { useEffect, useRef } from "react";
import { PodRowStatus } from "types/podRow";

interface OwnProps {
  readonly id: string;
  readonly columns: TableColumn[];
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
  const store = useRef<PodRowStore>(
    new PodRowStore(props.currency, props.strategy, props.tenor)
  ).current;
  const { id, columns, row, totalWidth, containerWidth, ...rowProps } = props;
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
      {columns.map((column: TableColumn, index: number) => {
        const width: string = getCellWidth(column.width, totalWidth);
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
