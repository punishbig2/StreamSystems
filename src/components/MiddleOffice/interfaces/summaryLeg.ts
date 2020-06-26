import moment from "moment";
import { ResultLeg } from "components/MiddleOffice/interfaces/pricingResult";

export interface SummaryLeg {
  strategy: string;
  tradeDate: moment.Moment;
  spotDate: moment.Moment;
  spot: number | null;
  cutCity: string;
  cutTime: string;
  source: string | null;
  delivery: string;
  usi: number | null;
  brokerage: {
    buyerComm: number | null;
    sellerComm: number | null;
  };
  dealOutput: ResultLeg;
}
