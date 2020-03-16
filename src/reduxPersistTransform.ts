import {WorkareaState} from 'redux/stateDefs/workareaState';
import {WorkspaceState} from 'redux/stateDefs/workspaceState';
import {WindowState, defaultWindowState} from 'redux/stateDefs/windowState';
import {defaultWorkareaState} from 'redux/reducers/workareaReducer';
import {createTransform} from 'redux-persist';

type Map<T> = { [id: string]: T };

const transformWorkarea = (workarea: WorkareaState): WorkareaState => {
  const {workspaces} = workarea;
  const keys: string[] = Object.keys(workspaces);
  const transformedWorkspaces: Map<WorkspaceState> =
    keys.reduce((map: Map<WorkspaceState>, id: string): Map<WorkspaceState> => {
      const {windows} = workspaces[id];
      const keys: string[] = Object.keys(windows);
      const transformedWindows: Map<WindowState> = keys.reduce((map: Map<WindowState>, id: string) => {
        const window: WindowState = windows[id];
        map[id] = {
          ...defaultWindowState,
          id: window.id,
          type: window.type,
          minimized: window.minimized,
          geometry: window.geometry,
          autoSize: window.autoSize,
          symbol: window.symbol,
          strategy: window.strategy,
        };
        return map;
      }, {});
      // Set the value in the new and empty map
      map[id] = {
        ...workspaces[id],
        windows: transformedWindows,
        toast: null,
        errorMessage: null,
        markets: [],
      };
      return map;
    }, {});
  return {
    ...defaultWorkareaState,
    workspaces: transformedWorkspaces,
    // We should keep also tha active workspace, otherwise
    // nothing is rendered
    activeWorkspace: workarea.activeWorkspace,
  };
};

const transform = (state: any, key: any): any => {
  switch (key) {
    case 'workarea':
      return transformWorkarea(state as WorkareaState);
    case 'messageBlotter':
      return {
        ...state, entries: [],
      };
    case 'executions':
      return [];
    case 'userProfile':
      return {};
    default:
      return state;
  }
};

export const WorkareaTransform = createTransform(
  transform,
  transform, {
    whitelist: ['workarea', 'messageBlotter', 'executions', 'userProfile'],
  });
