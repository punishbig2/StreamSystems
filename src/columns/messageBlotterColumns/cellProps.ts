import { Message } from "../../interfaces/message";
import { DealInsertStore } from "../../mobx/stores/dealInsertStore";

export type CellProps = {
  message: Message;
  store: DealInsertStore;
};
