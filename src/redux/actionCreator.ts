import {FXOAction, ActionKind} from 'redux/fxo-action';
import {WorkspaceAction} from 'redux/reducers/workspaceReducer';
import {WorkspaceActions} from 'redux/constants/workspaceConstants';
import {PodTileActions, PodTileAction} from 'redux/reducers/podTileReducer';

export const createAction = <T = any, A extends FXOAction = FXOAction<any>>(type: T, data?: any): A => (({
  kind: ActionKind.Base,
  type,
  data,
} as FXOAction) as A);

export const createWorkspaceAction = (workspaceID: string, type: WorkspaceActions, data?: any): FXOAction<WorkspaceActions, WorkspaceAction> => ({
  kind: ActionKind.Workspace,
  workspaceID,
  type,
  data,
});

export const createWindowAction = (workspaceID: string, windowID: string, type: PodTileActions, data?: any): FXOAction<PodTileActions, PodTileAction> => ({
  kind: ActionKind.Window,
  workspaceID,
  windowID,
  type,
  data,
});
