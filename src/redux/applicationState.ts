import {User} from 'interfaces/user';
import {MessageBlotterState} from 'redux/stateDefs/messageBlotterState';
import {WorkareaState} from 'redux/stateDefs/workareaState';

export interface ApplicationState {
  workarea: WorkareaState;
  messageBlotter: MessageBlotterState;
  auth: {
    user: User;
  };
}
