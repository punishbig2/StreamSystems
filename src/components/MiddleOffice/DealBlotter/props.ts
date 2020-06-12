import { Deal } from "./deal";
import { DealInsertStore } from "../../../mobx/stores/dealInsertStore";

export interface CellProps {
  deal: Deal;
  store: DealInsertStore;
}
