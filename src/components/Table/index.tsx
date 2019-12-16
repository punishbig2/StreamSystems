import {ColumnSpec} from 'components/Table/columnSpecification';
import {Header} from 'components/Table/Header';
import {VirtuallyScrollableArea} from 'components/VirtuallyScrollableArea';
import {SortInfo} from 'interfaces/sortInfo';
import React, {ReactElement, useState} from 'react';
import {theme} from 'theme';

export enum SortDirection {
  Descending, Ascending, None
}

interface Props {
  columns: ColumnSpec[];
  rows?: { [id: string]: any };
  scrollable: boolean;
  renderRow: (props: any) => ReactElement | null;
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
  const [sortBy, setSortBy] = useState<SortInfo | undefined>();
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
  if (sortBy) {
    const column: ColumnSpec = columnMap[sortBy.column];
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
      // FIXME: this is crazy ...
      rowProps.sort(sortFn(sortBy.direction));
    }
  }
  const style = {
    maxHeight: '100%',
    height: (rowProps.length + 1) * theme.tableRowSize + theme.tableHeaderHeight,
  };
  const addFilter = (column: string, keyword: string) => {
    const clean: string = keyword.trim();
    if (clean.length === 0) {
      setFilters({...filters, [column]: undefined});
    } else {
      setFilters({...filters, [column]: clean});
    }
  };
  const getBody = () => {
    if (props.scrollable) {
      return (
        <VirtuallyScrollableArea className={'tbody'} itemCount={rowProps.length}>
          {props.renderRow && rowProps.map(props.renderRow)}
        </VirtuallyScrollableArea>
      );
    } else if (props.renderRow) {
      return (
        <div className={'tbody'}>
          {rowProps.map(props.renderRow)}
        </div>
      );
    }
  };
  return (
    <div className={'table'} style={style}>
      <Header columns={columns} setSortBy={setSortBy} sortBy={sortBy} addFilter={addFilter} weight={total}/>
      {getBody()}
    </div>
  );
};

