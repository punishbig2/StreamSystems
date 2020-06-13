import { Deal } from "components/MiddleOffice/DealBlotter/deal";
import { observable, action } from "mobx";
import { Leg } from "components/MiddleOffice/interfaces/leg";

import moment from "moment";
import { Sides } from "interfaces/sides";
import { MOStrategy } from "components/MiddleOffice/interfaces/moStrategy";

class MiddleOfficeStore {
  @observable deal: Deal | null = null;
  @observable legs: Leg[] = [];

  @action.bound
  public setDeal(deal: Deal) {
    this.deal = deal;
  }

  @action.bound
  public clearStubLegs() {
    this.legs = [];
  }

  @action.bound
  public addStubLeg(info: {
    notional: number;
    party: string;
    side: Sides;
    vol: number | undefined;
    strike: string | undefined;
    option: string;
  }) {
    const stub: Leg = {
      ccy1Depo: null,
      ccy2Depo: null,
      days: null,
      deliveryDate: moment(),
      delta: null,
      expiryDate: moment(),
      fwdPts: null,
      fwdRate: null,
      gamma: null,
      hedge: null,
      notional: info.notional * 0.5,
      option: info.option,
      party: info.party,
      premium: null,
      premiumDate: moment(),
      price: null,
      side: info.side,
      strike: null,
      vega: null,
      vol: info.vol || null,
    };
    this.legs.push(stub);
  }
}

export default new MiddleOfficeStore();
