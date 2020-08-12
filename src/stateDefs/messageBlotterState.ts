import { Message } from "types/message";

export interface MessageBlotterState {
  readonly entries: ReadonlyArray<Message>;
}
