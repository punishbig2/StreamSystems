import { RowProps } from "components/MiddleOffice/DealBlotter/row";
import { ScrollArea } from "components/ScrollArea";
import { TableBody } from "components/Table/Body";
import { ColumnSpec } from "components/Table/columnSpecification";
import { TableHeader } from "components/Table/Header";
import { create } from "mobx-persist";
import { observer } from "mobx-react";
import { TableStore } from "mobx/stores/tableStore";
import React from "react";
import { getOptimalWidthFromColumnsSpec } from "utils/getOptimalWidthFromColumnsSpec";
import persistStorage from "utils/persistStorage";

interface Props {
  readonly id: string;
  readonly columns: ReadonlyArray<ColumnSpec>;
  readonly rows?: { [id: string]: any };
  readonly scrollable: boolean;
  readonly renderRow: (
    props: RowProps,
    index?: number
  ) => React.ReactElement | null;
  readonly allowReorderColumns?: boolean;
  readonly selectedRow?: string | null;
  readonly className?: string;
  readonly ref?: React.Ref<HTMLDivElement>;
  readonly style?: React.CSSProperties;
}

const BasicTable = (
  props: Props,
  ref: React.Ref<HTMLDivElement>
): React.ReactElement | null => {
  const [store] = React.useState<TableStore>(new TableStore(props.columns));
  const { rows: initialRows, columns: initialColumns, id } = props;
  const { rows, columns } = store;
  React.useEffect(() => {
    const hydrate = create({
      storage: persistStorage.tables,
      jsonify: true,
    });
    hydrate(id, store).then(() => {
      store.preFilterAndSort();
    });
  }, [store, id]);
  React.useEffect(() => {
    store.setRows(initialRows);
  }, [store, initialRows]);
  React.useEffect(() => {
    store.setInitialColumns(initialColumns);
  }, [store, initialColumns]);

  const [optimalWidth] = React.useState(
    getOptimalWidthFromColumnsSpec(columns)
  );
  const style = React.useMemo(
    (): React.CSSProperties => ({
      minWidth: "100%",
      ...props.style,
    }),
    [props.style]
  );
  const entries: [string, any][] = rows === null ? [] : Object.entries(rows);
  const totalWidth: number = columns.reduce(
    (total: number, column: ColumnSpec) => total + column.width,
    0
  );
  const rowsToProps = React.useCallback(
    ([key, row]: [string, any]) => ({
      id: key,
      totalWidth: totalWidth,
      containerWidth: optimalWidth,
      key,
      columns,
      row,
    }),
    [columns, optimalWidth, totalWidth]
  );
  const transformedRows: { [key: string]: any }[] = React.useMemo(
    () => entries.map(rowsToProps),
    [rowsToProps, entries]
  );
  const classes: string[] = ["table"];
  if (props.className) classes.push(props.className);
  return (
    <div id={props.id} ref={ref} className={classes.join(" ")} style={style}>
      <TableHeader
        columns={columns}
        allowReorderColumns={!!props.allowReorderColumns}
        totalWidth={totalWidth}
        containerWidth={optimalWidth}
        onSortBy={store.sortBy}
        onFiltered={store.filterBy}
        onColumnsOrderChange={store.updateColumnsOrder}
      />
      <ScrollArea>
        <TableBody
          scrollable={props.scrollable}
          rows={transformedRows}
          renderRow={props.renderRow}
        />
      </ScrollArea>
      <div className={"loading-banner"}>
        <div className={"spinner"} />
      </div>
    </div>
  );
};

export const Table: React.FC<Props> = observer(React.forwardRef(BasicTable));
