import { observable, action } from 'mobx';

export class DealInsertStore {
  @observable price: number | null = null;
  @observable size: number | null = null;
  @observable currency: string = '';
  @observable strategy: string = '';
  @observable buyer: string = '';
  @observable seller: string = '';

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
}
