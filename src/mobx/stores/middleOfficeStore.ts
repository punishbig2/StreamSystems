import { Deal } from "components/MiddleOffice/DealBlotter/deal";
import { observable, action } from "mobx";
import { Leg } from "components/MiddleOffice/interfaces/leg";

import moment from "moment";
import { Sides } from "interfaces/sides";
import { SummaryLeg } from "components/MiddleOffice/interfaces/summaryLeg";
import { Cut } from "components/MiddleOffice/interfaces/cut";
import { parseTime } from "timeUtils";
import { Globals } from "golbals";
import { Symbol } from "interfaces/symbol";

export interface StubLegInfo {
  notional: number | null;
  party: string;
  side: Sides;
  vol: number | undefined;
  strike: string | undefined;
  option: string;
  currencies: [string, string];
}

class MiddleOfficeStore {
  @observable deal: Deal | null = null;
  @observable legs: Leg[] = [];
  @observable summaryLeg: SummaryLeg | null = null;

  @action.bound
  public createSummaryLeg(cut: Cut, symbol: Symbol): void {
    const { legs, deal } = this;
    if (legs.length === 0 || deal === null) return;
    this.summaryLeg = {
      brokerage: { buyerComm: null, sellerComm: null },
      cutCity: cut.City,
      cutTime: cut.LocalTime,
      dealOutput: {
        delta: null,
        gamma: null,
        hedge: null,
        netPremium: null,
        pricePercent: null,
        vega: null,
      },
      delivery: "",
      source: symbol.FixingSource,
      spot: null,
      spotDate: moment(),
      spread: "",
      tradeDate: moment(parseTime(deal.transactionTime, Globals.timezone)),
      usi: null,
      strategy: legs[0].option,
    };
  }

  @action.bound
  public setDeal(deal: Deal) {
    this.deal = deal;
    this.summaryLeg = null;
    this.legs = [];
  }

  @action.bound
  public addStubLeg(info: StubLegInfo) {
    const { legs } = this;
    const stub: Leg = {
      depo: [
        {
          currency: info.currencies[0],
          value: 0,
        },
        {
          currency: info.currencies[1],
          value: 0,
        },
      ],
      days: null,
      deliveryDate: moment(),
      delta: null,
      expiryDate: moment(),
      fwdPts: null,
      fwdRate: null,
      gamma: null,
      hedge: null,
      notional: info.notional,
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
    legs.push(stub);
  }
}

export default new MiddleOfficeStore();
