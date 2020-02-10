import {STRM, WorkspaceState} from 'redux/stateDefs/workspaceState';
import {Currency} from 'interfaces/currency';
import {WindowState} from 'redux/stateDefs/windowState';

const createTransaction = async (storeName: string, mode: IDBTransactionMode): Promise<IDBTransaction> => {
  return new Promise<IDBTransaction>(
    (resolve: (tx: IDBTransaction) => void, reject: () => void) => {
      const request: any = indexedDB.open('fx-options', 2);
      request.onupgradeneeded = ({target: {result}}: any) => {
        const db: IDBDatabase = result;
        if (!db) return;
        // Create all stores
        try {
          db.createObjectStore('workarea');
        } catch {
        }
        try {
          db.createObjectStore('workspaces');
        } catch {
        }
        try {
          db.createObjectStore('windows');
        } catch {
        }
        try {
          db.createObjectStore('dark-pool');
        } catch {
        }
      };
      request.onsuccess = ({target: {result}}: any) => {
        const db: IDBDatabase = result;
        if (!db) return;
        resolve(db.transaction(storeName, mode));
      };
      request.onerror = () => reject();
    },
  );
};

export const FXOptionsDB = {
  getObject: async (name: string, key: string) => {
    const tx: IDBTransaction = await createTransaction(name, 'readonly');
    return new Promise((resolve: (data: any) => void, reject: () => void) => {
      const store: IDBObjectStore = tx.objectStore(name);
      const req: IDBRequest<any | undefined> = store.get(key);
      req.onsuccess = ({target: {result}}: any) => resolve(result);
      req.onerror = reject;
    });
  },
  del: async (storeName: string, rootKey: string) => {
    const tx: IDBTransaction = await createTransaction(storeName, 'readwrite');
    const store: IDBObjectStore = tx.objectStore(storeName);
    return store.delete(rootKey);
  },
  put: async (storeName: string, rootKey: string, key: string | null, value: any, replace: boolean = false) => {
    const tx: IDBTransaction = await createTransaction(storeName, 'readwrite');
    return new Promise((resolve: (data: any) => void, reject: () => void) => {
      const store: IDBObjectStore = tx.objectStore(storeName);
      // Finally save the internalValue to the custom store
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
                const array: any[] = result[key] === undefined ? [] : result[key];
                return store.put(
                  {...result, [key]: [...value, ...array]},
                  rootKey,
                );
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
    });
  },
  saveDarkPool: async (
    rowID: string,
    value: number | null,
  ) => {
    return FXOptionsDB.put('dark-pool', rowID, 'price', value);
  },
  getDarkPool: async (rowID: string): Promise<number | null> => {
    const object: any = await FXOptionsDB.getObject('dark-pool', rowID);
    if (object === undefined)
      return null;
    return object.price;
  },
  setWindowStrategy: async (windowID: string, strategy: string) => {
    return FXOptionsDB.put('windows', windowID, 'strategy', strategy);
  },
  setWindowSymbol: async (windowID: string, symbol: Currency) => {
    return FXOptionsDB.put('windows', windowID, 'symbol', symbol);
  },
  setWindowGeometry: async (windowID: string, geometry: ClientRect) => {
    return FXOptionsDB.put('windows', windowID, 'geometry', geometry);
  },
  addWindow: async (workspaceID: string, window: WindowState) => {
    return Promise.all([
      FXOptionsDB.put('windows', window.id, null, window),
      FXOptionsDB.put('workspaces', workspaceID, 'windows', [window.id]),
    ]);
  },
  removeWindow: async (workspaceID: string, windowID: string) => {
    const workspace = await FXOptionsDB.getObject('workspaces', workspaceID);
    if (!workspace)
      throw Error(`no workspace with id \`${workspaceID} was found'`);
    const windows: string[] = [...workspace.windows];
    const index: number = windows.indexOf(windowID);
    if (index === -1)
      throw Error(
        `no window with id \`${windowID} was found' in workspace ${workspaceID}`,
      );
    windows.splice(index, 1);
    await FXOptionsDB.del('windows', windowID);
    return FXOptionsDB.put('workspaces', workspaceID, 'windows', windows, true);
  },
  addWorkspace: async (workspace: WorkspaceState) => {
    const {name, id} = workspace;
    await FXOptionsDB.put('workspaces', workspace.id, null, {name, id}, true);
    return FXOptionsDB.put('workarea', 'workspaces', null, [workspace.id]);
  },
  getWorkspaceName: async (workspaceID: string): Promise<string> => {
    const workspace: any = await FXOptionsDB.getObject('workspaces', workspaceID);
    return workspace.name;
  },
  renameWorkspace: async (workspaceID: string, name: string) => {
    return FXOptionsDB.put('workspaces', workspaceID, 'name', name);
  },
  removeWorkspace: async (workspaceID: string) => {
    const workspaces: string[] = [...(await FXOptionsDB.getObject('workarea', 'workspaces'))];
    const index = workspaces.indexOf(workspaceID);
    if (index === -1)
      throw new Error('invalid workspace, cannot delete it');
    workspaces.splice(index, 1);
    const windows: string[] = await FXOptionsDB.getWindowsList(workspaceID);
    if (windows) {
      const promises: Promise<any>[] = windows.map(async (windowID: string) => {
        return FXOptionsDB.removeWindow(workspaceID, windowID);
      });
      await Promise.all(promises);
      await FXOptionsDB.del('workspaces', workspaceID);
    }
    await FXOptionsDB.del('workspaces', workspaceID);
    return FXOptionsDB.put('workarea', 'workspaces', null, workspaces, true);
  },
  getWorkspacesList: async () => {
    const workspaces = await FXOptionsDB.getObject('workarea', 'workspaces');
    if (!workspaces)
      return [];
    return workspaces;
  },
  getWindowsList: async (workspaceID: string): Promise<string[]> => {
    const workspace = await FXOptionsDB.getObject('workspaces', workspaceID);
    if (!workspace)
      return [];
    return workspace.windows;
  },
  getWindow: async (windowID: string): Promise<Window | undefined> => {
    return FXOptionsDB.getObject('windows', windowID);
  },
  setPersonality: async (workspaceID: string, personality: string) => {
    return FXOptionsDB.put('workspaces', workspaceID, 'personality', personality);
  },
  getPersonality: async (workspaceID: string): Promise<string> => {
    const workspace: any | undefined = await FXOptionsDB.getObject(
      'workspaces',
      workspaceID,
    );
    if (workspace === undefined) return STRM;
    if (!workspace.personality) return STRM;
    return workspace.personality;
  },
};

