import { Geometry } from '@cib/windows-manager';
import messageBlotterColumns, { BlotterTypes } from 'columns/messageBlotter';
import { ExtendedTableColumn, TableColumn } from 'components/Table/tableColumn';
import { action, computed, makeObservable, observable } from 'mobx';
import { ContentStore } from 'mobx/stores/contentStore';
import workareaStore from 'mobx/stores/workareaStore';
import React from 'react';
import { NONE } from 'stateDefs/workspaceState';
import { Message } from 'types/message';
import { Persistable } from 'types/persistable';
import { hasRole, Role } from 'types/role';
import { SortDirection } from 'types/sortDirection';
import { TileType } from 'types/tileType';
import * as users from 'types/user';

export class MessageBlotterStore extends ContentStore implements Persistable<MessageBlotterStore> {
  public readonly kind: TileType = TileType.MessageBlotter;

  public sortedColumns: {
    [columnName: string]: SortDirection;
  } = {};
  public sortingApplicationOrder: readonly string[] = [];
  public filters: { [columnName: string]: string } = {};
  public columnsOrder: readonly number[] = [];
  public initialColumns: readonly TableColumn[] = [];
  public originalRows: readonly Message[] = [];

  // Execution blotter specific
  public lastGeometry: Geometry = new Geometry(0, 0, 100, 100);
  public currencyGroupFilter = 'All';
  public isNew = true;
  public docked = true;

  public readonly blotterType: BlotterTypes;
  public columnsMap: { [columnName: string]: TableColumn } = {};

  constructor(blotterType: BlotterTypes) {
    super();
    this.blotterType = blotterType;

    makeObservable(this, {
      sortedColumns: observable,
      sortingApplicationOrder: observable.ref,
      filters: observable,
      columnsOrder: observable.ref,
      initialColumns: observable,
      originalRows: observable,
      lastGeometry: observable,
      currencyGroupFilter: observable,
      isNew: observable,
      serialized: computed,
      setOwner: action.bound,
      columns: computed,
      rows: computed,
      filterBy: action.bound,
      sortBy: action.bound,
      setRows: action.bound,
      updateColumnsOrder: action.bound,
      setInitialColumns: action.bound,
      setLastGeometry: action.bound,
      setCurrencyGroupFilter: action.bound,
      docked: observable,
    });
  }

  public static fromJson(data: { [key: string]: any }): MessageBlotterStore {
    const newStore = new MessageBlotterStore(data.blotterType);
    newStore.sortedColumns = data.sortedColumns;
    newStore.sortingApplicationOrder = data.sortingApplicationOrder;
    newStore.columnsOrder = data.columnsOrder;
    newStore.filters = data.filters;
    newStore.isNew = data.isNew;
    newStore.lastGeometry = data.lastGeometry;
    newStore.currencyGroupFilter = data.currencyGroupFilter ?? '';
    return newStore;
  }

  public get serialized(): { [key: string]: any } {
    return {
      sortedColumns: { ...this.sortedColumns },
      sortingApplicationOrder: [...this.sortingApplicationOrder],
      columnsOrder: [...this.columnsOrder],
      filters: { ...this.filters },
      blotterType: this.blotterType,
      lastGeometry: this.lastGeometry,
      currencyGroupFilter: this.currencyGroupFilter,
      isNew: this.isNew,
    };
  }

  public setOwner(user: users.User): void {
    const { roles } = user;
    const personality = workareaStore.personality;
    const brokerMode: boolean = hasRole(roles, Role.Broker) && personality === NONE;
    const columnsMap: { [key: string]: TableColumn[] } = messageBlotterColumns(this.blotterType);
    const columns: TableColumn[] = brokerMode ? columnsMap.broker : columnsMap.normal;
    this.setInitialColumns(columns);
  }

  public get columns(): readonly ExtendedTableColumn[] {
    const { initialColumns, columnsOrder } = this;

    return columnsOrder
      .filter((index: number) => index < initialColumns.length)
      .map((index: number) => {
        const column = initialColumns[index];
        const sortDirection = this.sortedColumns[column.name] ?? SortDirection.None;
        const filter = this.filters[column.name] ?? '';
        return {
          ...column,
          sortDirection: sortDirection,
          filter: filter,
        };
      });
  }

  public get rows(): any {
    const copy = this.originalRows;
    // Replace the `rows' object
    return copy.filter(this.getFilterFunction()).sort(this.getSortFunction());
  }

  public filterBy(columnName: string, keyword: string): void {
    this.filters[columnName] = keyword;
  }

  public sortBy(columnName: string, direction: SortDirection): void {
    const { sortingApplicationOrder } = this;
    const index: number = sortingApplicationOrder.indexOf(columnName);
    this.sortedColumns[columnName] = direction;
    if (index !== -1) {
      this.sortingApplicationOrder = [
        ...sortingApplicationOrder.slice(0, index),
        ...sortingApplicationOrder.slice(index + 1),
        columnName,
      ];
    } else {
      this.sortingApplicationOrder = [...sortingApplicationOrder, columnName];
    }
  }

  public setRows(rows: any): void {
    this.originalRows = rows;
  }

  public updateColumnsOrder(sourceIndex: number, targetIndex: number): void {
    const { columnsOrder } = this;
    const columnIndex: number = columnsOrder[sourceIndex];
    const newColumnsOrder = [
      ...columnsOrder.slice(0, sourceIndex),
      ...columnsOrder.slice(sourceIndex + 1),
    ];
    newColumnsOrder.splice(targetIndex, 0, columnIndex);
    this.columnsOrder = newColumnsOrder;
  }

  public setInitialColumns(columns: readonly TableColumn[]): void {
    const { columnsOrder } = this;
    this.initialColumns = columns;
    this.columnsMap = columns.reduce((map: { [name: string]: TableColumn }, spec: TableColumn) => {
      map[spec.name] = spec;
      return map;
    }, {});
    if (columnsOrder.length !== columns.length) {
      this.columnsOrder = columns.map((_: TableColumn, index: number): number => index);
    }
  }

  public getFilterFunction(): (r: any) => boolean {
    const { filters, columnsMap } = this;
    const names: string[] = Object.keys(filters);
    const trim = (value: string | undefined): string => (value ? value.trim() : '');

    return names.reduce(
      (fn: (r: any) => boolean, name: string): ((r: any) => boolean) => {
        const keyword: string | undefined = trim(filters[name]);
        if (keyword === undefined || keyword === '') return fn;
        const columnSpec: TableColumn | undefined = columnsMap[name];
        if (columnSpec === undefined) {
          return fn;
        }

        const filter: ((r: any, keyword: string) => boolean) | undefined =
          columnSpec.filterByKeyword;

        if (filter === undefined) return () => true;
        return (r: any) => filter(r, keyword);
      },
      () => true
    );
  }

  public getSortFunction(): (r1: any, r2: any) => number {
    const { sortingApplicationOrder, sortedColumns, columnsMap } = this;
    return sortingApplicationOrder.reduce(
      (fn: (r1: any, r2: any) => number, columnName: string) => {
        const sortOrder: SortDirection = sortedColumns[columnName];
        if (!sortOrder) return fn;
        const columnSpec: TableColumn | undefined = columnsMap[columnName];
        return (r1: any, r2: any) => {
          if (columnSpec.difference === undefined) return fn(r1, r2);
          if (fn(r1, r2) === 0) {
            const sign: number = sortOrder === SortDirection.Ascending ? -1 : 1;
            return sign * columnSpec.difference(r1, r2);
          }
          return fn(r1, r2);
        };
      },
      () => 0
    );
  }

  public setLastGeometry(geometry: Geometry, docked: boolean): void {
    this.lastGeometry = geometry;
    this.isNew = false;
    this.docked = docked;
  }

  public setCurrencyGroupFilter(value: string): void {
    this.currencyGroupFilter = value;
  }
}

export const MessageBlotterStoreContext = React.createContext<MessageBlotterStore>(
  new MessageBlotterStore(BlotterTypes.None)
);
