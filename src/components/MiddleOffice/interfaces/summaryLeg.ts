import moment from "moment";
import { Leg } from "components/MiddleOffice/interfaces/leg";

export interface SummaryLeg {
  strategy: string;
  tradeDate: moment.Moment;
  spotDate: moment.Moment;
  spot: number | null;
  cutCity: string;
  cutTime: string;
  source: string | null;
  delivery: string;
  usi: string | null;
  dealOutput: Leg & {
    gamma: number | null;
    vega: number | null;
  };
}
