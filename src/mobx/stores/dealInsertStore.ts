import { observable, action, computed } from 'mobx';
import messagesStore from './messagesStore';
import workareaStore from './workareaStore';
import { User } from '../../interfaces/user';
import { Sides } from '../../interfaces/sides';
import { priceFormatter } from '../../utils/priceFormatter';
import { sizeFormatter } from '../../utils/sizeFormatter';
import { ExecTypes } from '../../interfaces/message';

import { uuid } from 'uuidv4';

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

  @computed
  public get isReady(): boolean {
    if (this.seller !== ''
      && this.buyer !== ''
      && this.currency !== ''
      && this.strategy !== ''
      && this.price !== null
      && this.size !== null
    ) {
      return this.buyer !== this.seller;
    }
    return false;
  }

  @action.bound
  public addDeal() {
    const user: User = workareaStore.user;
    const price: string = priceFormatter(this.price);
    const size: string = sizeFormatter(this.size);
    const id: string = uuid();
    messagesStore.addEntry({
      '583': '',
      Account: '',
      ContraTrader: '',
      CumQty: size,
      LeavesQty: '0',
      OrderQty: size,
      LastQty: size,
      LastPx: price,
      LastShares: size,
      AvgPx: price,
      Price: price,
      Currency: this.currency,
      ExDestination: 'MANUAL',

      ExecBroker: this.buyer,
      MDMkt: this.seller,

      ExecID: id,
      OrderID: id,
      ClOrdID: id,
      ClOrdLinkId: id,

      ExecTransType: ExecTypes.Filled,
      ExecType: ExecTypes.Filled,
      OrdStatus: ExecTypes.Filled,
      OrdType: ExecTypes.Filled,
      Side: Sides.Sell,
      Strategy: this.strategy,
      Symbol: this.currency,
      Tenor: '1W',
      TransactTime: Date.now()
        .toString(),
      Username: user.email,
    });
  }
}
