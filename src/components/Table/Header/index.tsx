import {Column} from 'components/Table/Column';
import {ColumnSpec} from 'components/Table/columnSpecification';
import {SortDirection} from 'components/Table/index';
import {SortInfo} from 'interfaces/sortInfo';
import React from 'react';

interface HeaderProps {
  columns: ColumnSpec[];
  sortBy?: SortInfo;
  setSortBy: (sortInfo: SortInfo) => void;
  addFilter: (column: string, value: string) => void;
}

export const Header: <T extends unknown>(props: HeaderProps) => any = <T extends unknown>(props: HeaderProps) => {
  const {columns, sortBy} = props;
  const columnMapper = (total: number) => (column: ColumnSpec) => {
    const handleSorting = (): [SortDirection, () => void] => {
      const {direction} = (sortBy && sortBy.column === column.name) ? sortBy : {direction: SortDirection.None};
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
              sortable={column.sortable}
              filterable={column.filterable}
              onSorted={onSorted}
              sortDirection={sortDirection}
              onFiltered={(keyword: string) => props.addFilter(column.name, keyword)}
              width={100 * column.weight / total}>
        {column.header(props)}
      </Column>
    );
  };
  const total = columns.reduce((total: number, {weight}: ColumnSpec) => total + weight, 0);
  return (
    <div className={'thead'}>
      <div className={'tr'}>
        {columns.map(columnMapper(total))}
      </div>
    </div>
  );
};
