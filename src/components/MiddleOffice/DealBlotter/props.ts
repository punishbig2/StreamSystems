import { Deal } from "components/MiddleOffice/interfaces/deal";
import { DealInsertStore } from "../../../mobx/stores/dealInsertStore";

export interface CellProps {
  deal: Deal;
  store: DealInsertStore;
}
