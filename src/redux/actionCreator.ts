import { FXOAction, ActionKind } from 'redux/fxo-action';

export const createAction = <T = any, A extends FXOAction = FXOAction<any>>(type: T, data?: any): A => (({
  kind: ActionKind.Base,
  type,
  data,
} as FXOAction) as A);

/*export const createWorkspaceAction = (workspaceID: string, type: WorkspaceActions, data?: any): FXOAction<WorkspaceActions, WorkspaceAction> => ({
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
});*/
