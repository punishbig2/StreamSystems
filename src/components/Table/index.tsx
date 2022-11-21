import { RowProps } from 'components/MiddleOffice/DealBlotter/row';
import { TableBody } from 'components/Table/Body';
import { TableHeader } from 'components/Table/Header';
import { ExtendedTableColumn, TableColumn } from 'components/Table/tableColumn';
import { HeaderStore, HeaderStoreContext } from 'mobx/stores/headerStore';
import { themeStore } from 'mobx/stores/themeStore';
import { observer } from 'mobx-react';
import React from 'react';
import { SortDirection } from 'types/sortDirection';
import { getOptimalWidthFromColumnsSpec } from 'utils/getOptimalWidthFromColumnsSpec';

interface Props {
  readonly columns: readonly ExtendedTableColumn[];
  readonly rows: { [id: string]: any };
  readonly renderRow: (props: RowProps, index?: number) => React.ReactElement | null;

  readonly allowReorderColumns?: boolean;
  readonly selectedRow?: string | null;
  readonly className?: string;
  readonly ref?: React.Ref<HTMLDivElement>;
  readonly style?: React.CSSProperties;

  readonly onFiltered?: (column: string, value: string) => void;
  readonly onSortBy?: (columnName: string, order: SortDirection) => void;
  readonly onColumnsOrderChange?: (sourceIndex: number, targetIndex: number) => void;
}

const BasicTable = observer(
  React.forwardRef(function BasicTable(
    props: Props,
    ref: React.Ref<HTMLDivElement>
  ): React.ReactElement | null {
    const { rows, columns } = props;

    const optimalWidth = React.useMemo(
      (): number =>
        getOptimalWidthFromColumnsSpec(themeStore.fontFamily, themeStore.fontSize, columns),
      [columns]
    );

    const style = React.useMemo(
      (): React.CSSProperties => ({
        minWidth: `${optimalWidth}px`,
        ...props.style,
      }),
      [optimalWidth, props.style]
    );

    const entries: Array<[string, any]> = React.useMemo(
      (): Array<[string, any]> => (rows === null ? [] : Object.entries(rows)),
      [rows]
    );

    const totalWidth: number = React.useMemo(
      (): number => columns.reduce((total: number, column: TableColumn) => total + column.width, 0),
      [columns]
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

    const transformedRows: Array<{ [key: string]: any }> = React.useMemo(() => {
      return entries.map(rowsToProps);
    }, [rowsToProps, entries]);

    const classes: string[] = ['table'];

    if (props.className) classes.push(props.className);

    return (
      <div ref={ref} className={classes.join(' ')} style={style}>
        <HeaderStoreContext.Provider value={new HeaderStore()}>
          <TableHeader
            columns={columns}
            allowReorderColumns={props.allowReorderColumns === true}
            totalWidth={totalWidth}
            containerWidth={optimalWidth}
            onSortBy={props.onSortBy}
            onFiltered={props.onFiltered}
            onColumnsOrderChange={props.onColumnsOrderChange}
          />
        </HeaderStoreContext.Provider>
        <TableBody
          rows={transformedRows}
          selectedRow={props.selectedRow}
          renderRow={props.renderRow}
        />
        <div className="loading-banner">
          <div className="spinner" />
        </div>
      </div>
    );
  })
);

export const Table: React.FC<Props> = BasicTable;
