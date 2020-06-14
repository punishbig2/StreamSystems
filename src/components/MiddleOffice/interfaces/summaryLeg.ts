import moment from "moment";

export interface SummaryLeg {
  strategy: string;
  tradeDate: moment.Moment;
  spotDate: moment.Moment;
  spot: number | null;
  spread?: number;
  cutCity: string;
  cutTime: string;
  source: string | null;
  delivery: string;
  usi: number | null;
  brokerage: {
    buyerComm: number | null;
    sellerComm: number | null;
  };
  dealOutput: {
    netPremium: number | null;
    pricePercent: number | null;
    delta: number | null;
    gamma: number | null;
    vega: number | null;
    hedge: number | null;
  };
}
