import {Column} from 'components/Table/Column';
import {ColumnSpec} from 'components/Table/columnSpecification';
import {SortDirection} from 'components/Table/index';
import {SortInfo} from 'interfaces/sortInfo';
import React from 'react';
import styled from 'styled-components';

interface HeaderProps<T> {
  columns: ColumnSpec[];
  handlers?: T;
  table: any;
  sortBy?: SortInfo;
  setSortBy: (sortInfo: SortInfo) => void;
}

const HeaderLayout = styled.div``;

export const Header: <T extends unknown>(props: HeaderProps<T>) => any = <T extends unknown>(props: HeaderProps<T>) => {
  const {columns, sortBy} = props;
  const total = columns.reduce((total, {weight}) => total + weight, 0);
  const columnMapper = (column: ColumnSpec) => {
    const handleSorting = (): [SortDirection, () => void] => {
      if (!sortBy || sortBy.column !== column.name)
        return [SortDirection.None, () => null];
      const {direction} = sortBy;
      const onSorted = () => {
        switch (direction) {
          case SortDirection.Ascending:
            props.setSortBy({column: column.name, direction: SortDirection.Descending});
            break;
          case SortDirection.Descending:
            props.setSortBy({column: column.name, direction: SortDirection.None});
            break;
          case SortDirection.None:
            props.setSortBy({column: column.name, direction: SortDirection.Ascending});
            break;
        }
      };
      // Return the function and the direction
      return [direction, onSorted];
    };
    const [sortDirection, onSorted] = handleSorting();
    return (
      <Column key={column.name}
              width={100 * column.weight / total}
              sortable={column.sortable}
              filterable={column.filterable}
              onSorted={onSorted}
              sortDirection={sortDirection}>
        {column.header(props)}
      </Column>
    );
  };
  return (
    <HeaderLayout>
      {columns.map(columnMapper)}
    </HeaderLayout>
  );
};
