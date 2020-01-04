import {IWorkspace} from 'interfaces/workspace';
import {Window} from 'interfaces/window';
import {ToolbarState} from 'redux/stateDefs/workspaceState';

export const FXOptionsDB = {
  getObject: async (name: string, key: string) => {
    return new Promise((resolve: (data: any) => void, reject: () => void) => {
      const request: any = indexedDB.open('fx-options');
      request.onsuccess = (event: any) => {
        const {result} = event.target;
        const db: IDBDatabase = result;
        if (!db)
          return;
        const tx: IDBTransaction = db.transaction(name, 'readonly');
        const store: IDBObjectStore = tx.objectStore(name);
        const reader = store.get(key);
        reader.onsuccess = ({target: {result}}: any) => resolve(result);
        reader.onerror = reject;
      };
      request.onerror = reject;
    });
  },
  put: async (storeName: string, rootKey: string, key: string | null, value: any, replace: boolean = false) => {
    return new Promise((resolve: (data: any) => void, reject: () => void) => {
      const request: any = indexedDB.open('fx-options');
      request.onupgradeneeded = ({target: {result}}: any) => {
        const db: IDBDatabase = result;
        if (!db)
          return;
        // Create all stores
        db.createObjectStore('workarea');
        db.createObjectStore('workspaces');
        db.createObjectStore('tiles');
      };
      request.onsuccess = ({target: {result}}: any) => {
        const db: IDBDatabase = result;
        if (!db)
          return;
        const tx: IDBTransaction = db.transaction(storeName, 'readwrite');
        const store: IDBObjectStore = tx.objectStore(storeName);
        // Finally save the value to the custom store
        const reader: IDBRequest = store.get(rootKey);
        reader.onsuccess = ({target: {result}}: any) => {
          const getWriter = () => {
            if (replace) {
              if (key === null) {
                return store.put(value, rootKey);
              } else {
                return store.put({[key]: value}, rootKey);
              }
            } else {
              if (result === undefined) {
                if (key === null) {
                  return store.add(value, rootKey);
                } else {
                  return store.add({[key]: value}, rootKey);
                }
              } else if (key === null) {
                return store.put([...value, ...result], rootKey);
              } else {
                if (value instanceof Array) {
                  return store.put({...result, [key]: [...value, ...result[key]]}, rootKey);
                } else {
                  return store.put({...result, [key]: value}, rootKey);
                }
              }
            }
          };
          const writer: IDBRequest<IDBValidKey> = getWriter();
          writer.onsuccess = ({target: {result}}: any) => resolve(result);
          writer.onerror = reject;
        };
      };
      request.onerror = reject;
    });
  },
  setWindowStrategy: async (windowID: string, strategy: string) => {
    return FXOptionsDB.put('tiles', windowID, 'strategy', strategy);
  },
  setWindowSymbol: async (windowID: string, symbol: string) => {
    return FXOptionsDB.put('tiles', windowID, 'symbol', symbol);
  },
  setWindowGeometry: async (windowID: string, geometry: ClientRect) => {
    return FXOptionsDB.put('tiles', windowID, 'geometry', geometry);
  },
  addWindow: async (workspaceID: string, window: Window) => {
    return Promise.all([
        FXOptionsDB.put('tiles', window.id, null, window),
        FXOptionsDB.put('workspaces', workspaceID, 'tiles', [window.id]),
      ],
    );
  },
  addWorkspace: async (workspace: any) => {
    return FXOptionsDB.put('workarea', 'workspaces', null, [workspace]);
  },
  removeWorkspace: async (id: string) => {
    const workspaces: IWorkspace[] = await FXOptionsDB.getObject('workarea', 'workspaces');
    const found = workspaces.findIndex((workspace: IWorkspace) => workspace.id === id);
    if (found === -1)
      throw new Error('invalid workspace, cannot delete it');
    const spliced: IWorkspace[] = [...workspaces];
    spliced.splice(found, 1);
    console.log(spliced);
    return FXOptionsDB.put('workarea', 'workspaces', null, spliced, true);
  },
  getWorkspacesList: async () => {
    const workspaces = await FXOptionsDB.getObject('workarea', 'workspaces');
    if (!workspaces)
      return {};
    return workspaces.reduce((obj: any, workspace: IWorkspace) => {
      return {...obj, [workspace.id]: workspace};
    }, {});
  },
  getWindowsList: async (workspaceID: string): Promise<string[]> => {
    const workspace = await FXOptionsDB.getObject('workspaces', workspaceID);
    if (!workspace)
      return [];
    return workspace.tiles;
  },
  getWindow: async (windowID: string): Promise<Window | undefined> => {
    return FXOptionsDB.getObject('tiles', windowID);
  },
  togglePinToolbar: async (workspaceID: string) => {
    const {toolbarState} = await FXOptionsDB.getObject('workspaces', workspaceID);
    if (!toolbarState || !toolbarState.pinned) {
      FXOptionsDB.put('workspaces', workspaceID, 'toolbarState', {pinned: true});
    } else {
      FXOptionsDB.put('workspaces', workspaceID, 'toolbarState', {pinned: false});
    }
  },
  getToolbarState: async (workspaceID: string): Promise<ToolbarState> => {
    const {toolbarState} = await FXOptionsDB.getObject('workspaces', workspaceID);
    return toolbarState;
  },
};
