import { ColumnSpec } from 'components/Table/columnSpecification';
import { Header } from 'components/Table/Header';
import { VirtualScroll } from 'components/VirtualScroll';
import { SortInfo } from 'interfaces/sortInfo';
import React, { CSSProperties, ReactElement, useState, useMemo } from 'react';
import getStyles from 'styles';
import { getOptimalWidthFromColumnsSpec } from 'getOptimalWIdthFromColumnsSpec';

export enum SortDirection {
  Descending,
  Ascending,
  None
}

interface Props {
  columns: ColumnSpec[];
  rows?: { [id: string]: any };
  scrollable: boolean;
  renderRow: (props: any, index?: number) => ReactElement | null;
  className?: string;
  ref?: React.Ref<HTMLDivElement>;
}

type Filters = { [key: string]: string | undefined };
type ColumnMap = { [key: string]: ColumnSpec };

const applyFilters = (filters: Filters, columns: ColumnMap) => (props: any) => {
  const entries: [string, string | undefined][] = Object.entries(filters);
  return entries.every(([name, keyword]: [string, string | undefined]) => {
    const { row } = props;
    if (keyword === undefined) return true;
    const column: ColumnSpec | undefined = columns[name];
    if (!column || !column.filterByKeyword) return true;
    return column.filterByKeyword(row, keyword.toLowerCase());
  });
};

export const Table: React.FC<Props> = React.forwardRef((props: Props, ref: React.Ref<HTMLDivElement>): ReactElement | null => {
  const { rows, columns } = props;
  const [filters, setFilters] = useState<Filters>({});
  const [sortBy, setSortBy] = useState<{ [key: string]: SortInfo }>({});
  const [optimalWidth] = useState(getOptimalWidthFromColumnsSpec(columns));
  const style = useMemo((): CSSProperties => ({ minWidth: `${optimalWidth}px` }), [optimalWidth]);
  if (!rows)
    return null; // FIXME: show "No data in this depth message"
  const entries: [string, any][] = Object.entries(rows);
  const total: number = columns.reduce((total: number, column: ColumnSpec) => total + column.width, 0);
  const propertyMapper = ([key, row]: [string, any]) => ({
    id: key,
    totalWidth: total,
    containerWidth: optimalWidth,
    key,
    columns,
    row,
  });

  const columnMap: ColumnMap = columns.reduce(
    (map: ColumnMap, column: ColumnSpec): ColumnMap => {
      map[column.name] = column;
      return map;
    },
    {},
  );
  // Map each order to properties
  const rowProps: { [key: string]: any }[] = entries
    .map(propertyMapper)
    .filter(applyFilters(filters, columnMap));
  const getSortFn = () => {
    const sortColumns = Object.values(sortBy);
    if (sortColumns.length > 0) {
      const combineSortFns = (combined: (x: any, y: any) => number, info: SortInfo) => {
        const column: ColumnSpec = columnMap[info.column];
        if (column) {
          const sortFn = (direction: SortDirection) => {
            if (direction === SortDirection.Ascending) {
              return ({ row: row1 }: any, { row: row2 }: any) => {
                if (!column.difference) return 0;
                return column.difference(row1, row2);
              };
            } else {
              return ({ row: row1 }: any, { row: row2 }: any) => {
                if (!column.difference) return 0;
                return column.difference(row2, row1);
              };
            }
          };
          return (x: any, y: any) =>
            combined(x, y) + sortFn(info.direction)(x, y);
        } else {
          // FIXME: is this an error?
          return combined;
        }
      };
      return sortColumns.reduce(combineSortFns, (): number => 0);
    } else {
      return undefined;
    }
  };

  const addFilter = (column: string, keyword: string) => {
    const clean: string = keyword.trim();
    if (clean.length === 0) {
      setFilters({ ...filters, [column]: undefined });
    } else {
      setFilters({ ...filters, [column]: clean });
    }
  };

  const addSortColumn = (info: SortInfo) => {
    const { column, direction } = info;
    if (direction === SortDirection.None) {
      const copy: { [key: string]: SortInfo } = { ...sortBy };
      delete copy[column];
      setSortBy(copy);
    } else {
      setSortBy({ ...sortBy, [column]: info });
    }
  };

  const getBody = (rowProps: any) => {
    const rows = rowProps;
    if (rows.length === 0)
      return (
        <div className={'empty-table'}>
          <h1>There's no data yet</h1>
        </div>
      );
    const sortFn = getSortFn();
    if (sortFn !== undefined)
      rows.sort(sortFn);
    if (props.scrollable) {
      const styles = getStyles();
      return (
        <VirtualScroll itemSize={styles.tableRowHeight} className={'tbody'}>
          {rows.map(props.renderRow)}
        </VirtualScroll>
      );
    } else {
      return <div className={'tbody'}>{rows.map(props.renderRow)}</div>;
    }
  };

  const getHeaders = () => {
    return (
      <Header columns={columns}
              addSortColumn={addSortColumn}
              sortBy={sortBy}
              addFilter={addFilter}
              totalWidth={total}
              containerWidth={optimalWidth}/>
    );
  };

  const classes: string[] = ['table'];
  if (props.className)
    classes.push(props.className);
  return (
    <div ref={ref} className={classes.join(' ')} style={style}>
      {getHeaders()}
      {getBody(rowProps)}
      <div className={'loading-banner'}>
        <div className={'spinner'}/>
      </div>
    </div>
  );
});

// Table.whyDidYouRender = true;
