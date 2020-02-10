import {MessageBlotterState} from 'redux/stateDefs/messageBlotterState';
import {WorkareaState} from 'redux/stateDefs/workareaState';
import {RunState} from 'redux/stateDefs/runState';
import {UserProfileState} from 'interfaces/user';
import {Message} from 'interfaces/message';

export interface ApplicationState {
  workarea: WorkareaState;
  messageBlotter: MessageBlotterState;
  run: { [key: string]: RunState };
  userProfile: UserProfileState;
  executions: Message[];

  [key: string]: any;
}
