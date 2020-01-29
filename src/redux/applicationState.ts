import {MessageBlotterState} from 'redux/stateDefs/messageBlotterState';
import {SettingsState} from 'redux/stateDefs/settingsState';
import {WorkareaState} from 'redux/stateDefs/workareaState';
import {RunState} from 'redux/stateDefs/runState';
import {UserProfileState} from 'interfaces/user';

export interface ApplicationState {
  workarea: WorkareaState;
  messageBlotter: MessageBlotterState;
  run: { [key: string]: RunState };
  settings: SettingsState;
  userProfile: UserProfileState;

  [key: string]: any;
}
