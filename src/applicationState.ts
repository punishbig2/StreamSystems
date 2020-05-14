import { MessageBlotterState } from "stateDefs/messageBlotterState";
import { WorkareaState } from "stateDefs/workareaState";
import { UserProfileState } from "interfaces/user";
import { Message } from "interfaces/message";

export interface ApplicationState {
  workarea: WorkareaState;
  messageBlotter: MessageBlotterState;
  // run: { [key: string]: RunState };
  userProfile: UserProfileState;
  executions: Message[];
}
