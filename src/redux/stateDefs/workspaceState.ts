import {Window} from 'interfaces/window';

export interface ToolbarState {
  pinned: boolean;
  hovering: boolean;
  visible: boolean;
}

export interface WorkspaceState {
  windows: {[id: string]: Window};
  toast: string | null;
  toolbarState: ToolbarState;
  markets: string[];
}
