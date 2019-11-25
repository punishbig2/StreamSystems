import {ColumnSpec} from 'components/Table/columnSpecification';
import {Header} from 'components/Table/Header';
import {VirtuallyScrollableArea} from 'components/VirtuallyScrollableArea';
import {SortInfo} from 'interfaces/sortInfo';
import moment, {Moment} from 'moment';
import React, {ReactElement, useState} from 'react';
import {theme} from 'theme';

export enum SortDirection {
  Descending, Ascending, None
}

interface Props {
  columns: ColumnSpec[];
  rows?: { [id: string]: any };
  renderRow: (props: any) => ReactElement | null;
}

const DateFormat: string = 'MM-DD-YYYY hh:mm p';
const compare = (v1: any, v2: any) => {
  const date: Moment = moment(v1, DateFormat);
  if (v1 === undefined)
    return 1;
  if (v2 === undefined)
    return -1;
  if (!isNaN(Number(v1))) {
    return Number(v1) - Number(v2);
  } else if (date.isValid()) {
    const second: Moment = moment(v2, DateFormat);
    return date.unix() - second.unix();
  } else {
    return v1.localeCompare(v2);
  }
};

export const Table: (props: Props) => (React.ReactElement | null) = (props: Props): ReactElement | null => {
  const {rows, columns} = props;
  const [filters, setFilters] = useState<{ [key: string]: string | undefined }>({});
  const [sortBy, setSortBy] = useState<SortInfo | undefined>();
  if (!rows)
    return null; // FIXME: show "No data in this depth message"
  const entries: [string, any][] = Object.entries(rows);
  const total: number = columns.reduce((total: number, column: ColumnSpec) => total + column.weight, 0);
  const propertyMapper = ([key, row]: [string, any]) => ({id: key, weight: total, key, columns, row});
  const applyFilters = (props: any) => {
    const entries: [string, string | undefined][] = Object.entries(filters);
    return entries.every(([name, keyword]: [string, string | undefined]) => {
      const {row} = props;
      if (!row[name])
        return false;
      if (keyword === undefined)
        return true;
      const value: string = row[name].toLowerCase();
      return value.includes(keyword.toLowerCase());
    });
  };
  // Map each entry to properties
  const rowProps: { [key: string]: any }[] = entries
    .map(propertyMapper)
    .filter(applyFilters);
  if (sortBy) {
    const column: string = sortBy.column;
    const sortFn = (direction: SortDirection) => {
      if (direction === SortDirection.Ascending) {
        return ({row: row1}: any, {row: row2}: any) => compare(row1[column], row2[column]);
      } else {
        return ({row: row1}: any, {row: row2}: any) => compare(row2[column], row1[column]);
      }
    };
    // FIXME: this is crazy ...
    rowProps
      .sort(sortFn(sortBy.direction));
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
  return (
    <div className={'table'} style={style}>
      <Header columns={columns} setSortBy={setSortBy} sortBy={sortBy} addFilter={addFilter} weight={total}/>
      <VirtuallyScrollableArea itemCount={rowProps.length} className={'tbody'}>
        {props.renderRow && rowProps.map(props.renderRow)}
      </VirtuallyScrollableArea>
    </div>
  );
};

