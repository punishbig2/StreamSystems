import {Window} from 'interfaces/window';

export interface WorkspaceState {
  windows: {[id: string]: Window};
  toast: string | null;
}
