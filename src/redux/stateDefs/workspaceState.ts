import { Window } from "interfaces/window";

export interface ToolbarState {
  pinned: boolean;
  hovering: boolean;
  visible: boolean;
}

export const STRM: string = "None";

export interface WorkspaceState {
  windows: { [id: string]: Window };
  toast: string | null;
  toolbarState: ToolbarState;
  markets: string[];
  isUserProfileModalVisible: boolean;
  personality: string;
  errorMessage: string | null;
}

export const defaultWorkspaceState: WorkspaceState = {
  windows: {},
  toast: null,
  toolbarState: { visible: false, hovering: false, pinned: false },
  markets: [],
  isUserProfileModalVisible: false,
  personality: STRM,
  errorMessage: null
};
