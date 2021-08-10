import messageBlotterColumns, { BlotterTypes } from "columns/messageBlotter";
import { TableColumn } from "components/Table/tableColumn";
import { action, computed, observable } from "mobx";
import { ContentStore } from "mobx/stores/contentStore";
import workareaStore from "mobx/stores/workareaStore";
import React from "react";
import { STRM } from "stateDefs/workspaceState";
import { Message } from "types/message";
import { Persistable } from "types/persistable";
import { Role } from "types/role";
import { SortDirection } from "types/sortDirection";
import { TileType } from "types/tileType";
import { User } from "types/user";

export class MessageBlotterStore
  extends ContentStore
  implements Persistable<MessageBlotterStore> {
  public readonly kind: TileType = TileType.MessageBlotter;

  @observable private sortedColumns: {
    [columnName: string]: SortDirection;
  } = {};
  @observable private sortingApplicationOrder: ReadonlyArray<string> = [];
  @observable private filters: { [columnName: string]: string } = {};
  @observable private columnsOrder: ReadonlyArray<number> = [];
  @observable private initialColumns: ReadonlyArray<TableColumn> = [];
  @observable private originalRows: ReadonlyArray<Message> = [];

  private readonly blotterType: BlotterTypes;
  private columnsMap: { [columnName: string]: TableColumn } = {};

  constructor(blotterType: BlotterTypes) {
    super();
    this.blotterType = blotterType;
  }

  public static fromJson(data: { [key: string]: any }): MessageBlotterStore {
    const newStore = new MessageBlotterStore(data.blotterType);
    newStore.sortedColumns = data.sortedColumns;
    newStore.sortingApplicationOrder = data.sortingApplicationOrder;
    newStore.columnsOrder = data.columnsOrder;
    newStore.filters = data.filters;
    return newStore;
  }

  @computed
  public get serialized(): { [key: string]: any } {
    return {
      sortedColumns: { ...this.sortedColumns },
      sortingApplicationOrder: [...this.sortingApplicationOrder],
      columnsOrder: [...this.columnsOrder],
      filters: { ...this.filters },
      blotterType: this.blotterType,
    };
  }

  public static executionBlotter(user: User): MessageBlotterStore {
    const store = new MessageBlotterStore(BlotterTypes.Executions);
    store.setOwner(user);
    return store;
  }

  @action.bound
  public setOwner(user: User): void {
    const { roles } = user;
    const personality = workareaStore.personality;
    const brokerMode: boolean =
      roles.includes(Role.Broker) && personality === STRM;
    const columnsMap: { [key: string]: TableColumn[] } = messageBlotterColumns(
      this.blotterType
    );
    const columns: TableColumn[] = brokerMode
      ? columnsMap.broker
      : columnsMap.normal;
    this.setInitialColumns(columns);
  }

  @computed
  public get columns(): ReadonlyArray<TableColumn> {
    const { initialColumns, columnsOrder } = this;
    return columnsOrder
      .filter((index: number) => index < initialColumns.length)
      .map((index: number) => initialColumns[index]);
  }

  @computed
  public get rows(): any {
    const copy = this.originalRows;
    // Replace the `rows' object
    return copy.filter(this.getFilterFunction()).sort(this.getSortFunction());
  }

  @action.bound
  public filterBy(columnName: string, keyword: string): void {
    this.filters[columnName] = keyword;
  }

  @action.bound
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

  @action.bound
  public setRows(rows: any) {
    this.originalRows = rows;
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

  @action.bound
  private setInitialColumns(columns: ReadonlyArray<TableColumn>) {
    this.initialColumns = columns;
    this.columnsMap = columns.reduce(
      (map: { [name: string]: TableColumn }, spec: TableColumn) => {
        map[spec.name] = spec;
        return map;
      },
      {}
    );
    this.columnsOrder = columns.map(
      (column: TableColumn, index: number) => index
    );
  }

  private getFilterFunction(): (r: any) => boolean {
    const { filters, columnsMap } = this;
    const names: string[] = Object.keys(filters);
    const trim = (value: string | undefined) => (value ? value.trim() : "");
    return names.reduce(
      (fn: (r: any) => boolean, name: string): ((r: any) => boolean) => {
        const keyword: string | undefined = trim(filters[name]);
        if (keyword === undefined || keyword === "") return fn;
        const columnSpec: TableColumn = columnsMap[name];
        const filter: ((r: any, keyword: string) => boolean) | undefined =
          columnSpec.filterByKeyword;
        if (filter === undefined) return () => true;
        return (r: any) => filter(r, keyword);
      },
      () => true
    );
  }

  private getSortFunction(): (r1: any, r2: any) => number {
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
}

export const MessageBlotterStoreContext = React.createContext<MessageBlotterStore>(
  new MessageBlotterStore(BlotterTypes.None)
);
