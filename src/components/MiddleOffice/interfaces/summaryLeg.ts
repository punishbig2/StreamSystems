import moment from "moment";
import { DealOutput } from "types/dealOutput";

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
  dealOutput: DealOutput;
  fwdrate1: number | null;
  fwdpts1: number | null;
  fwdrate2: number | null;
  fwdpts2: number | null;
}
