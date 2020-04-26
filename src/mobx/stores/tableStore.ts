import { observable, action, computed } from 'mobx';
import { ColumnSpec, ColumnState } from 'components/Table/columnSpecification';
import { persist } from 'mobx-persist';

export enum SortOrder {
  None,
  Descending,
  Ascending,
}

export class TableStore {
  @persist('object') @observable sortedColumns: { [columnName: string]: SortOrder } = {};
  @persist('list') @observable sortingApplicationOrder: string[] = [];
  @persist('object') @observable filters: { [columnName: string]: string } = {};
  @persist('list') @observable columnsOrder: number[] = [];

  @observable rows: any = {};

  private initialRows: any = {};
  private initialColumns: ColumnSpec[] = [];
  private columnsMap: { [columnName: string]: ColumnSpec } = {};

  constructor(columns: ColumnSpec[]) {
    this.initialColumns = columns;
    this.columnsMap = columns.reduce((map: { [name: string]: ColumnSpec }, spec: ColumnSpec) => {
      map[spec.name] = spec;
      return map;
    }, {});
    this.columnsOrder = columns.map((column: ColumnSpec, index: number) => index);
  }

  @computed
  public get columns(): ColumnState[] {
    const { initialColumns, columnsOrder } = this;
    return columnsOrder
      .filter((index: number) => index < initialColumns.length)
      .map((index: number) => initialColumns[index])
      .map((column: ColumnSpec): ColumnState => {
        const sortOrder: SortOrder = this.sortedColumns[column.name];
        if (sortOrder === undefined) {
          return { ...column, sortOrder: SortOrder.None };
        } else {
          return { ...column, sortOrder };
        }
      });
  }

  private getFilterFunction(): (r: any) => boolean {
    const { filters, columnsMap } = this;
    const names: string[] = Object.keys(filters);
    const trim = (value: string | undefined) => value ? value.trim() : '';
    return names.reduce((fn: (r: any) => boolean, name: string): (r: any) => boolean => {
      const keyword: string | undefined = trim(filters[name]);
      if (keyword === undefined || keyword === '')
        return fn;
      const columnSpec: ColumnSpec = columnsMap[name];
      const filter: ((r: any, keyword: string) => boolean) | undefined = columnSpec.filterByKeyword;
      if (filter === undefined)
        throw new Error('attempting to filter by a non existing column');
      return (r: any) => filter(r, keyword);
    }, () => true);
  };

  private getSortFunction(): (r1: any, r2: any) => number {
    const { sortingApplicationOrder, sortedColumns, columnsMap } = this;
    return sortingApplicationOrder.reduce(
      (fn: (r1: any, r2: any) => number, columnName: string) => {
        const sortOrder: SortOrder = sortedColumns[columnName];
        if (!sortOrder)
          return fn;
        const columnSpec: ColumnSpec | undefined = columnsMap[columnName];
        return (r1: any, r2: any) => {
          if (columnSpec.difference === undefined)
            return fn(r1, r2);
          if (fn(r1, r2) === 0) {
            const sign: number = sortOrder === SortOrder.Ascending ? -1 : 1;
            return sign * columnSpec.difference(r1, r2);
          }
          return fn(r1, r2);
        };
      }, () => 0);
  };

  @action.bound
  public preFilterAndSort() {
    if (this.rows instanceof Array) {
      const rowsCopy: any[] = [...this.initialRows];
      // Replace the `rows' object
      this.rows = rowsCopy
        .filter(this.getFilterFunction())
        .sort(this.getSortFunction());
    } else {
      // In this case sorting/filtering is not allowed
      this.rows = this.initialRows;
    }
  }

  @action.bound
  public filterBy(columnName: string, keyword: string): void {
    this.filters[columnName] = keyword;
    this.preFilterAndSort();
  }

  @action.bound
  public sortBy(columnName: string): void {
    const { sortingApplicationOrder } = this;
    const currentValue: SortOrder = this.sortedColumns[columnName] ? this.sortedColumns[columnName] : SortOrder.None;
    const index: number = sortingApplicationOrder.indexOf(columnName);
    switch (currentValue) {
      case SortOrder.None:
        this.sortedColumns[columnName] = SortOrder.Ascending;
        break;
      case SortOrder.Ascending:
        this.sortedColumns[columnName] = SortOrder.Descending;
        break;
      case SortOrder.Descending:
        this.sortedColumns[columnName] = SortOrder.None;
        break;
    }
    if (index !== -1) {
      this.sortingApplicationOrder = [
        ...sortingApplicationOrder.slice(0, index),
        ...sortingApplicationOrder.slice(index + 1),
        columnName,
      ];
    } else {
      this.sortingApplicationOrder = [...sortingApplicationOrder, columnName];
    }
    this.preFilterAndSort();
  }

  @action.bound
  public setRows(rows: any) {
    this.initialRows = rows;
    // Apply filtering and sorting to rows
    this.preFilterAndSort();
  }

  @action.bound
  public updateColumnsOrder(sourceIndex: number, targetIndex: number) {
    const { columnsOrder } = this;
    const columnIndex: number = columnsOrder[sourceIndex];
    const newColumnsOrder = [
      ...columnsOrder.slice(0, sourceIndex),
      ...columnsOrder.slice(sourceIndex + 1),
    ];
    newColumnsOrder.splice(targetIndex, 0, columnIndex);
    this.columnsOrder = newColumnsOrder;
  }
}

