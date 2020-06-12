import { Deal } from "components/MiddleOffice/DealBlotter/deal";
import { observable, action } from "mobx";
import { Leg } from "components/MiddleOffice/interfaces/leg";

import moment from "moment";
import { Sides } from "interfaces/sides";
import { MOStrategy } from "interfaces/moStrategy";

class MiddleOfficeStore {
  @observable deal: Deal | null = null;
  @observable.ref legs: Leg[] = [];

  @action.bound
  public setDeal(deal: Deal) {
    this.deal = deal;
  }

  @action.bound
  public createStubLegs(
    price: number,
    notional: number,
    party: string,
    side: Sides,
    strategy: MOStrategy
  ) {
    const stub: Leg = {
      ccy1Depo: 0,
      ccy2Depo: 0,
      days: 0,
      deliveryDate: moment(),
      delta: 0,
      expiryDate: moment(),
      fwdPts: 0,
      fwdRate: 0,
      gamma: 0,
      hedge: 0,
      notional: notional * 0.5,
      option: strategy.OptionProductType,
      party: party,
      premium: 0,
      premiumDate: moment(),
      price: price,
      side: side,
      strike: 0,
      vega: 0,
      vol: 0,
    };
    const legs = [];
    for (let i: number = 0; i < strategy.pricerlegs; ++i) {
      legs.push(stub);
    }
    this.legs = legs;
  }
}

export default new MiddleOfficeStore();
