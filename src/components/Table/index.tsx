import { RowProps } from "components/MiddleOffice/DealBlotter/row";
import { ScrollArea } from "components/ScrollArea";
import { TableBody } from "components/Table/Body";
import { TableColumn, TableColumnState } from "components/Table/tableColumn";
import { TableHeader } from "components/Table/Header";
import { observer } from "mobx-react";
import React from "react";
import { getOptimalWidthFromColumnsSpec } from "utils/getOptimalWidthFromColumnsSpec";

interface Props {
  readonly columns: ReadonlyArray<TableColumnState>;
  readonly rows: { [id: string]: any };
  readonly renderRow: (
    props: RowProps,
    index?: number
  ) => React.ReactElement | null;
  readonly allowReorderColumns?: boolean;
  readonly selectedRow?: string | null;
  readonly className?: string;
  readonly ref?: React.Ref<HTMLDivElement>;
  readonly style?: React.CSSProperties;

  readonly onFiltered?: (column: string, value: string) => void;
  readonly onSortBy?: (columnName: string) => void;
  readonly onColumnsOrderChange?: (
    sourceIndex: number,
    targetIndex: number
  ) => void;
}

const BasicTable = (
  props: Props,
  ref: React.Ref<HTMLDivElement>
): React.ReactElement | null => {
  const { rows, columns } = props;

  const optimalWidth = React.useMemo(
    (): number => getOptimalWidthFromColumnsSpec(columns),
    [columns]
  );

  const style = React.useMemo(
    (): React.CSSProperties => ({
      minWidth: `${optimalWidth}px`,
      ...props.style,
    }),
    [optimalWidth, props.style]
  );
  const entries: [string, any][] = rows === null ? [] : Object.entries(rows);
  const totalWidth: number = columns.reduce(
    (total: number, column: TableColumn) => total + column.width,
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
    <div ref={ref} className={classes.join(" ")} style={style}>
      <TableHeader
        columns={columns}
        allowReorderColumns={props.allowReorderColumns === true}
        totalWidth={totalWidth}
        containerWidth={optimalWidth}
        onSortBy={props.onSortBy}
        onFiltered={props.onFiltered}
        onColumnsOrderChange={props.onColumnsOrderChange}
      />
      <ScrollArea>
        <TableBody
          scrollable={false}
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
