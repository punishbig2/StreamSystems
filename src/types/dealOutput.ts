import {Leg} from "components/MiddleOffice/types/leg";

export type DealOutput = Leg & {
  gamma: number | null;
  vega: number | null;
  spotDate: Date | null;
};
