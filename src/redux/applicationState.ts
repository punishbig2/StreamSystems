import {MessageBlotterState} from 'redux/stateDefs/messageBlotterState';
import {WorkareaState} from 'redux/stateDefs/workareaState';
import {RunState} from 'redux/stateDefs/runState';
import {UserProfileState} from 'interfaces/user';

export interface ApplicationState {
  workarea: WorkareaState;
  messageBlotter: MessageBlotterState;
  run: { [key: string]: RunState };
  userProfile: UserProfileState;

  [key: string]: any;
}
