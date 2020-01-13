import {ColumnSpec} from 'components/Table/columnSpecification';
import {Header} from 'components/Table/Header';
import {VirtualScroll} from 'components/VirtualScroll';
import {SortInfo} from 'interfaces/sortInfo';
import React, {CSSProperties, ReactElement, useState, useMemo} from 'react';

export enum SortDirection {
  Descending, Ascending, None
}

interface Props {
  columns: ColumnSpec[];
  rows?: { [id: string]: any };
  scrollable: boolean;
  renderRow: (props: any) => ReactElement | null;
  className?: string;
  hideHeaders?: boolean;
}

type Filters = { [key: string]: string | undefined };
type ColumnMap = { [key: string]: ColumnSpec };

const applyFilters = (filters: Filters, columns: ColumnMap) => (props: any) => {
  const entries: [string, string | undefined][] = Object.entries(filters);
  return entries.every(([name, keyword]: [string, string | undefined]) => {
    const {row} = props;
    if (keyword === undefined)
      return true;
    const column: ColumnSpec | undefined = columns[name];
    if (!column || !column.filterByKeyword)
      return true;
    return column.filterByKeyword(row, keyword.toLowerCase());
  });
};

export const Table: (props: Props) => (React.ReactElement | null) = (props: Props): ReactElement | null => {
  const {rows, columns} = props;
  const [filters, setFilters] = useState<Filters>({});
  const [sortBy, setSortBy] = useState<{ [key: string]: SortInfo }>({});
  const style = useMemo((): CSSProperties => {
    // Create an element to use it as a placeholder and measure
    // the size of the column using the template of the column
    // specification
    const el = document.createElement('div');

    const {body} = document;
    const {style} = el;
    // FIXME: ideally we should be able to read variables from the .scss file
    style.display = 'inline-block';
    style.fontFamily = '"Roboto", sans-serif';
    style.fontSize = '15px';
    style.fontWeight = '500';
    style.padding = '12px';
    // Temporarily add the element to the document so that it's measurable
    body.appendChild(el);
    // Sums the widths of individual elements
    const reducer = (value: number, column: ColumnSpec): number => {
      const {template} = column;
      el.innerHTML = template;
      if (column.sortable)
        return value + el.offsetWidth + 24;
      return value + el.offsetWidth;
    };
    const minWidth: string = columns.reduce(reducer, 0) + 'px';
    body.removeChild(el);
    return {
      minWidth,
    };
  }, [columns]);
  if (!rows)
    return null; // FIXME: show "No data in this depth message"
  const entries: [string, any][] = Object.entries(rows);
  const total: number = columns.reduce((total: number, column: ColumnSpec) => total + column.weight, 0);
  const propertyMapper = ([key, row]: [string, any]) => ({id: key, weight: total, key, columns, row});

  const columnMap: ColumnMap = columns.reduce(
    (map: ColumnMap, column: ColumnSpec): ColumnMap => {
      map[column.name] = column;
      return map;
    }, {});
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
              return ({row: row1}: any, {row: row2}: any) => {
                if (!column.difference)
                  return 0;
                return column.difference(row1, row2);
              };
            } else {
              return ({row: row1}: any, {row: row2}: any) => {
                if (!column.difference)
                  return 0;
                return column.difference(row2, row1);
              };
            }
          };
          return (x: any, y: any) => combined(x, y) + sortFn(info.direction)(x, y);
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
      setFilters({...filters, [column]: undefined});
    } else {
      setFilters({...filters, [column]: clean});
    }
  };


  const addSortColumn = (info: SortInfo) => {
    const {column, direction} = info;
    if (direction === SortDirection.None) {
      const copy: { [key: string]: SortInfo } = {...sortBy};
      delete copy[column];
      setSortBy(copy);
    } else {
      setSortBy({...sortBy, [column]: info});
    }
  };

  const getBody = (rowProps: any) => {
    const rows = rowProps;
    const sortFn = getSortFn();
    if (sortFn !== undefined)
      rows.sort(sortFn);
    if (props.scrollable) {
      return (
        <VirtualScroll itemSize={24} className={'tbody'}>
          {rows.map(props.renderRow)}
        </VirtualScroll>
      );
    } else if (props.renderRow) {
      return (
        <div className={'tbody'}>
          {rows.map(props.renderRow)}
        </div>
      );
    }
  };
  const getHeaders = () => {
    if (props.hideHeaders)
      return null;
    return (
      <Header columns={columns} addSortColumn={addSortColumn} sortBy={sortBy} addFilter={addFilter} weight={total}/>
    );
  };

  const classes: string[] = ['table'];
  if (props.className)
    classes.push(props.className);
  return (
    <div className={classes.join(' ')} style={style}>
      {getHeaders()}
      {getBody(rowProps)}
    </div>
  );
};

