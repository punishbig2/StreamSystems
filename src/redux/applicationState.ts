import {MessageBlotterState} from 'redux/stateDefs/messageBlotterState';
import {SettingsState} from 'redux/stateDefs/settingsState';
import {WorkareaState} from 'redux/stateDefs/workareaState';

export interface ApplicationState {
  workarea: WorkareaState;
  messageBlotter: MessageBlotterState;
  settings: SettingsState;
}
