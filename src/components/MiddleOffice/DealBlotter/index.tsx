import { columns } from 'components/MiddleOffice/DealBlotter/columns';
import { DealRow, RowProps } from 'components/MiddleOffice/DealBlotter/row';
import { Deal } from 'components/MiddleOffice/types/deal';
import { Table } from 'components/Table';
import { ExtendedTableColumn, TableColumn } from 'components/Table/tableColumn';
import deepEqual from 'deep-equal';
import { MiddleOfficeStore, MiddleOfficeStoreContext } from 'mobx/stores/middleOfficeStore';
import React, { ReactElement, useState } from 'react';
import { SortDirection } from 'types/sortDirection';

interface Props {
  readonly id: string;
  readonly disabled: boolean;
  readonly deals: readonly Deal[];
  readonly onDealSelected: (deal: Deal | null) => void;
  readonly selectedRow: string | null;
}

interface Filter {
  readonly column: TableColumn;
  readonly value: string;
}

interface Sorter {
  readonly column: TableColumn;
  readonly direction: SortDirection;
}

type SortFn<T> = (v1: T, v2: T) => number;

export const DealBlotter: React.FC<Props> = React.memo(
  function DealBlotter(props: Props): ReactElement | null {
    const { deals } = props;
    const { onDealSelected } = props;
    const [, setTable] = useState<HTMLDivElement | null>(null);
    const [filters, setFilters] = React.useState<readonly Filter[]>([]);
    const [sorters, setSorters] = React.useState<readonly Sorter[]>([]);
    const store = React.useContext<MiddleOfficeStore>(MiddleOfficeStoreContext);
    const filteredRows = React.useMemo((): readonly Deal[] => {
      const filterFn = filters.reduce(
        (fn: (value: Deal) => boolean, filter: Filter): ((value: Deal) => boolean) => {
          return (value: Deal): boolean => {
            const { column } = filter;
            const proxyValue = new Proxy(value, {
              get: (target: Deal, key: keyof Deal): any => {
                if (key === 'buyer' || key === 'seller') {
                  const value = target[key];
                  const entity = store.entitiesMap[value];
                  if (entity === undefined) {
                    return value;
                  }
                  return entity.id;
                }
                return target[key];
              },
            });
            if (column.filterByKeyword === undefined) {
              return fn(proxyValue);
            }
            return fn(proxyValue) && column.filterByKeyword(proxyValue, filter.value);
          };
        },
        (): boolean => true
      );

      const getSign = (direction: SortDirection): 0 | 1 | -1 => {
        switch (direction) {
          case SortDirection.None:
            return 0;
          case SortDirection.Descending:
            return -1;
          case SortDirection.Ascending:
            return 1;
        }
      };

      const sortFn = sorters.reduce(
        (fn: SortFn<Deal>, sorter: Sorter): SortFn<Deal> => {
          return (v1: Deal, v2: Deal): number => {
            const { column } = sorter;
            const initial = deals.length * fn(v1, v2);
            if (column.difference !== undefined) {
              const sign = getSign(sorter.direction);
              return initial + column.difference(v1, v2) * sign;
            }
            return initial;
          };
        },
        (): number => 0
      );
      return deals.filter(filterFn).sort(sortFn);
    }, [deals, filters, sorters, store.entitiesMap]);

    const getColumnByName = (name: string): TableColumn | undefined =>
      columns.find((c: TableColumn): boolean => c.name === name);

    const onFiltered = (columnName: string, value: string): void => {
      const filteredFilters = filters.filter(
        ({ column: { name } }: Filter): boolean => name !== columnName
      );
      if (value.trim() === '') {
        setFilters(filteredFilters);
      } else {
        const column: TableColumn | undefined = getColumnByName(columnName);
        if (column === undefined) {
          throw new Error(`cannot sort by ${columnName}`);
        }
        setFilters([...filteredFilters, { column: column, value }]);
      }
    };

    const onSortBy = (columnName: string, direction: SortDirection): void => {
      const matcher = ({ column: { name } }: Sorter): boolean => name !== columnName;
      const column = getColumnByName(columnName);
      if (column === undefined) throw new Error(`cannot sort by ${columnName}`);
      const filteredSorters = sorters.filter(matcher);
      if (direction === SortDirection.None) {
        setSorters(filteredSorters);
      } else {
        setSorters([...filteredSorters, { column: column, direction: direction }]);
      }
    };

    const _columns = React.useMemo(
      (): readonly ExtendedTableColumn[] =>
        columns.map(
          (column: TableColumn): ExtendedTableColumn => ({
            ...column,
            sortDirection:
              sorters.find((sorter: Sorter): boolean => sorter.column.name === column.name)
                ?.direction ?? SortDirection.None,
            filter: '',
          })
        ),
      [sorters]
    );

    return (
      <Table
        columns={_columns}
        rows={filteredRows}
        renderRow={(props: RowProps): ReactElement => (
          <DealRow key={props.row.id} {...props} onClick={onDealSelected} />
        )}
        onFiltered={onFiltered}
        onSortBy={onSortBy}
        selectedRow={props.selectedRow}
        ref={setTable}
        allowReorderColumns={true}
        className={props.disabled ? 'disabled' : undefined}
      />
    );
  },
  (prevProps: Props, nextProps: Props) => {
    if (prevProps.selectedRow !== nextProps.selectedRow) return false;
    if (prevProps.disabled !== nextProps.disabled) return false;
    return deepEqual(prevProps.deals, nextProps.deals);
  }
);
