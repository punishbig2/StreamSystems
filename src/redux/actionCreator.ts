import {FXOAction} from 'redux/fxo-action';
import {WorkspaceAction} from 'redux/reducers/workspaceReducer';
import {WorkspaceActions} from 'redux/constants/workspaceConstants';

export const createAction = <T = any, A extends FXOAction = FXOAction<any>>(type: T, data?: any): A => (({
  type,
  data,
} as FXOAction) as A);

export const createWorkspaceAction = (workspaceID: string, type: WorkspaceActions, data?: any): FXOAction<WorkspaceActions, WorkspaceAction> => ({
  workspaceID, type, data,
});
