import {Column} from 'components/Table/Column';
import {ColumnSpec} from 'components/Table/columnSpecification';
import {SortDirection} from 'components/Table/index';
import {SortInfo} from 'interfaces/sortInfo';
import React from 'react';
import {percentage} from 'utils';

interface HeaderProps {
  columns: ColumnSpec[];
  sortBy: { [key: string]: SortInfo };
  addSortColumn: (sortInfo: SortInfo) => void;
  weight: number;
  addFilter: (column: string, value: string) => void;
}

export const Header: <T extends unknown>(props: HeaderProps) => any = <T extends unknown>(
  props: HeaderProps,
) => {
  const {columns, sortBy} = props;
  const sortColumns: SortInfo[] = Object.values(sortBy);
  const columnMapper = (weight: number) => (column: ColumnSpec) => {
    const handleSorting = (): [SortDirection, () => void] => {
      const sortInfo: SortInfo | undefined = sortColumns.find(
        (info: SortInfo) => info.column === column.name,
      );
      const direction = sortInfo ? sortInfo.direction : SortDirection.None;
      const onSorted = () => {
        switch (direction) {
          case SortDirection.Ascending:
            props.addSortColumn({
              column: column.name,
              direction: SortDirection.Descending,
            });
            break;
          case SortDirection.Descending:
            props.addSortColumn({
              column: column.name,
              direction: SortDirection.None,
            });
            break;
          case SortDirection.None:
            props.addSortColumn({
              column: column.name,
              direction: SortDirection.Ascending,
            });
            break;
        }
      };
      // Return the function and the direction
      return [direction, onSorted];
    };
    const [sortDirection, onSorted] = handleSorting();
    return (
      <Column
        key={column.name}
        sortable={column.sortable}
        filterable={column.filterable}
        onSorted={onSorted}
        sortDirection={sortDirection}
        onFiltered={(keyword: string) => props.addFilter(column.name, keyword)}
        width={percentage(column.weight, weight)}
      >
        {column.header(props)}
      </Column>
    );
  };
  return (
    <div className={'thead'}>
      <div className={'tr'}>{columns.map(columnMapper(props.weight))}</div>
    </div>
  );
};
