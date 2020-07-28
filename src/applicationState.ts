import { MessageBlotterState } from "stateDefs/messageBlotterState";
import { WorkareaState } from "stateDefs/workareaState";
import { UserProfileState } from "types/user";
import { Message } from "types/message";

export interface ApplicationState {
  workarea: WorkareaState;
  messageBlotter: MessageBlotterState;
  // run: { [key: string]: RunState };
  userProfile: UserProfileState;
  executions: Message[];
}
