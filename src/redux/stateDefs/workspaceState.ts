import {WindowState} from 'redux/stateDefs/windowState';

export const STRM: string = 'None';

export interface WorkspaceState {
  id: string;
  name: string;
  windows: { [id: string]: WindowState };
  toast: string | null;
  markets: string[];
  isUserProfileModalVisible: boolean;
  personality: string;
  errorMessage: string | null;
}

export const defaultWorkspaceState: WorkspaceState = {
  id: '',
  name: '',
  windows: {},
  toast: null,
  markets: [],
  isUserProfileModalVisible: false,
  personality: STRM,
  errorMessage: null,
};
