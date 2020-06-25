import { observable, action, computed } from "mobx";
import { priceFormatter } from "utils/priceFormatter";
import { sizeFormatter } from "utils/sizeFormatter";

import { uuid } from "uuidv4";
import { API } from "API";

export class DealInsertStore {
  @observable price: number | null = null;
  @observable size: number | null = null;
  @observable currency: string = "";
  @observable strategy: string = "";
  @observable buyer: string = "";
  @observable seller: string = "";

  @action.bound
  public setPrice(price: number | null) {
    this.price = price;
  }

  @action.bound
  public setSize(size: number | null) {
    this.size = size;
  }

  @action.bound
  public setCurrency(currency: string) {
    this.currency = currency;
  }

  @action.bound
  public setStrategy(strategy: string) {
    this.strategy = strategy;
  }

  @action.bound
  public setBuyer(buyer: string) {
    this.buyer = buyer;
  }

  @action.bound
  public setSeller(seller: string) {
    this.seller = seller;
  }

  @computed
  public get isReady(): boolean {
    if (
      this.seller !== "" &&
      this.buyer !== "" &&
      this.currency !== "" &&
      this.strategy !== "" &&
      this.price !== null &&
      this.size !== null
    ) {
      return this.buyer !== this.seller;
    }
    return false;
  }

  @action.bound
  public addDeal() {
    API.createDeal({
      linkid: uuid(),
      price: priceFormatter(this.price),
      size: sizeFormatter(this.size),
      strategy: this.strategy,
      symbol: this.currency,
      seller: this.seller,
      buyer: this.buyer,
    }).then((response: any) => {
      console.log(response);
    });
  }
}
