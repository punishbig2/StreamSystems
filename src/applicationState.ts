import { MessageBlotterState } from "stateDefs/messageBlotterState";
import { WorkareaState } from "stateDefs/workareaState";
import { UserProfileState } from "types/user";
import { Message } from "types/message";

export interface ApplicationState {
  readonly workarea: WorkareaState;
  readonly messageBlotter: MessageBlotterState;
  // run: { [key: string]: RunState };
  readonly userProfile: UserProfileState;
  readonly executions: Message[];
}
