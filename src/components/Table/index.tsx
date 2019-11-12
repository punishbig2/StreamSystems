import {ColumnSpec} from 'components/Table/columnSpecification';
import {Header} from 'components/Table/Header';
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
  const [sortBy, setSortBy] = useState<SortInfo | undefined>();
  if (!rows)
    return null; // FIXME: show "No data in this table message"
  const entries: [string, any][] = Object.entries(rows);
  const propertyMapper = ([key, row]: [string, any]) => ({id: key, key, columns, row});
  // Map each entry to properties
  const rowProps: { [key: string]: any }[] = entries
    .map(propertyMapper);
  if (sortBy) {
    const column: string = sortBy.column;
    const sortFn = (direction: SortDirection) => {
      if (direction === SortDirection.Ascending) {
        return ({row: row1}: any, {row: row2}: any) => compare(row1[column], row2[column]);
      } else {
        return ({row: row1}: any, {row: row2}: any) => compare(row2[column], row1[column]);
      }
    };
    rowProps.sort(sortFn(sortBy.direction));
  }
  const style = {
    maxHeight: '100%',
    height: (rowProps.length + 1) * theme.tableRowSize + theme.tableHeaderHeight,
  };
  return (
    <div className={'table'} style={style}>
      <Header columns={columns} setSortBy={setSortBy} sortBy={sortBy}/>
      <div className={'tbody'}>
        {props.renderRow && rowProps.map(props.renderRow)}
      </div>
    </div>
  );
};

