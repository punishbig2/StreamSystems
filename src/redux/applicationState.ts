import {MessageBlotterState} from 'redux/stateDefs/messageBlotterState';
import {SettingsState} from 'redux/stateDefs/settingsState';
import {WorkareaState} from 'redux/stateDefs/workareaState';
import {RunState} from 'redux/stateDefs/runState';

export interface ApplicationState {
  workarea: WorkareaState;
  messageBlotter: MessageBlotterState;
  run: {[key: string]: RunState};
  settings: SettingsState;
  [key: string]: any;
}
