import { Leg } from "components/MiddleOffice/interfaces/leg";

export type DealOutput = Leg & {
  gamma: number | null;
  vega: number | null;
};
