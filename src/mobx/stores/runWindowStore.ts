import { action, observable } from "mobx";
import { Order } from "types/order";
import { PodTable } from "types/podTable";

export class RunWindowStore {
  @observable.ref orders: PodTable = {};
  @observable.ref original: PodTable = {};
  @observable.ref defaultBidSize = 0;
  @observable defaultOfrSize = 0;
  @observable isLoading = false;

  constructor(orders: { [tenor: string]: ReadonlyArray<Order> }) {}

  @action.bound
  public setSpread(spread: number): void {}
}
