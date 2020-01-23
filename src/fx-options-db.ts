import { IWorkspace } from "interfaces/workspace";
import { Window } from "interfaces/window";
import { ToolbarState, STRM } from "redux/stateDefs/workspaceState";

const createTransaction = async (
  storeName: string,
  mode: IDBTransactionMode
): Promise<IDBTransaction> => {
  return new Promise<IDBTransaction>(
    (resolve: (tx: IDBTransaction) => void, reject: () => void) => {
      const request: any = indexedDB.open("fx-options");
      request.onupgradeneeded = ({ target: { result } }: any) => {
        const db: IDBDatabase = result;
        if (!db) return;
        // Create all stores
        db.createObjectStore("workarea");
        db.createObjectStore("workspaces");
        db.createObjectStore("windows");
      };
      request.onsuccess = ({ target: { result } }: any) => {
        const db: IDBDatabase = result;
        if (!db) return;
        resolve(db.transaction(storeName, mode));
      };
      request.onerror = () => reject();
    }
  );
};

export const FXOptionsDB = {
  getObject: async (name: string, key: string) => {
    const tx: IDBTransaction = await createTransaction(name, "readonly");
    return new Promise((resolve: (data: any) => void, reject: () => void) => {
      const store: IDBObjectStore = tx.objectStore(name);
      const req: IDBRequest<any | undefined> = store.get(key);
      req.onsuccess = ({ target: { result } }: any) => resolve(result);
      req.onerror = reject;
    });
  },
  del: async (storeName: string, rootKey: string) => {
    const tx: IDBTransaction = await createTransaction(storeName, "readwrite");
    const store: IDBObjectStore = tx.objectStore(storeName);
    return store.delete(rootKey);
  },
  put: async (
    storeName: string,
    rootKey: string,
    key: string | null,
    value: any,
    replace: boolean = false
  ) => {
    const tx: IDBTransaction = await createTransaction(storeName, "readwrite");
    return new Promise((resolve: (data: any) => void, reject: () => void) => {
      const store: IDBObjectStore = tx.objectStore(storeName);
      // Finally save the internalValue to the custom store
      const reader: IDBRequest = store.get(rootKey);
      reader.onsuccess = ({ target: { result } }: any) => {
        const getWriter = () => {
          if (replace) {
            if (key === null) {
              return store.put(value, rootKey);
            } else {
              return store.put({ [key]: value }, rootKey);
            }
          } else {
            if (result === undefined) {
              if (key === null) {
                return store.add(value, rootKey);
              } else {
                return store.add({ [key]: value }, rootKey);
              }
            } else if (key === null) {
              return store.put([...value, ...result], rootKey);
            } else {
              if (value instanceof Array) {
                return store.put(
                  { ...result, [key]: [...value, ...result[key]] },
                  rootKey
                );
              } else {
                return store.put({ ...result, [key]: value }, rootKey);
              }
            }
          }
        };
        const writer: IDBRequest<IDBValidKey> = getWriter();
        writer.onsuccess = ({ target: { result } }: any) => resolve(result);
        writer.onerror = reject;
      };
    });
  },
  setWindowDP: async (
    windowID: string,
    tenor: string,
    value: number | null
  ) => {
    return FXOptionsDB.put("windows", windowID, "dark-pool", {
      [tenor]: value
    });
  },
  getWindowDP: async (
    windowID: string,
    tenor: string
  ): Promise<number | null> => {
    const object: any = FXOptionsDB.getObject("windows", windowID);
    const dp: any = object["dark-pool"];
    if (!dp) return null;
    if (!object[tenor]) return null;
    return object[tenor] as number;
  },
  setWindowStrategy: async (windowID: string, strategy: string) => {
    return FXOptionsDB.put("windows", windowID, "strategy", strategy);
  },
  setWindowSymbol: async (windowID: string, symbol: string) => {
    return FXOptionsDB.put("windows", windowID, "symbol", symbol);
  },
  setWindowGeometry: async (windowID: string, geometry: ClientRect) => {
    return FXOptionsDB.put("windows", windowID, "geometry", geometry);
  },
  addWindow: async (workspaceID: string, window: Window) => {
    return Promise.all([
      FXOptionsDB.put("windows", window.id, null, window),
      FXOptionsDB.put("workspaces", workspaceID, "windows", [window.id])
    ]);
  },
  removeWindow: async (workspaceID: string, windowID: string) => {
    const workspace = await FXOptionsDB.getObject("workspaces", workspaceID);
    if (!workspace)
      throw Error(`no workspace with id \`${workspaceID} was found'`);
    const windows: string[] = [...workspace.windows];
    const index: number = windows.indexOf(windowID);
    if (index === -1)
      throw Error(
        `no window with id \`${windowID} was found' in workspace ${workspaceID}`
      );
    console.log("before", windows);
    windows.splice(index, 1);
    console.log("after", windows);
    await FXOptionsDB.del("windows", windowID);
    return FXOptionsDB.put("workspaces", workspaceID, "windows", windows, true);
  },
  addWorkspace: async (workspace: any) => {
    return FXOptionsDB.put("workarea", "workspaces", null, [workspace]);
  },
  removeWorkspace: async (workspaceID: string) => {
    const workspaces: IWorkspace[] = [
      ...(await FXOptionsDB.getObject("workarea", "workspaces"))
    ];
    const index = workspaces.findIndex(
      (workspace: IWorkspace) => workspace.id === workspaceID
    );
    if (index === -1) throw new Error("invalid workspace, cannot delete it");
    workspaces.splice(index, 1);
    const windows: string[] = await FXOptionsDB.getWindowsList(workspaceID);
    const promises: Promise<any>[] = windows.map(async (windowID: string) => {
      return FXOptionsDB.removeWindow(workspaceID, windowID);
    });
    await Promise.all(promises);
    await FXOptionsDB.del("workspaces", workspaceID);
    return FXOptionsDB.put("workarea", "workspaces", null, workspaces, true);
  },
  getWorkspacesList: async () => {
    const workspaces = await FXOptionsDB.getObject("workarea", "workspaces");
    if (!workspaces) return {};
    return workspaces.reduce((obj: any, workspace: IWorkspace) => {
      return { ...obj, [workspace.id]: workspace };
    }, {});
  },
  getWindowsList: async (workspaceID: string): Promise<string[]> => {
    const workspace = await FXOptionsDB.getObject("workspaces", workspaceID);
    if (!workspace) return [];
    return workspace.windows;
  },
  getWindow: async (windowID: string): Promise<Window | undefined> => {
    return FXOptionsDB.getObject("windows", windowID);
  },
  setPersonality: async (workspaceID: string, personality: string) => {
    FXOptionsDB.put("workspaces", workspaceID, "personality", personality);
  },
  getPersonality: async (workspaceID: string): Promise<string> => {
    const workspace: any | undefined = await FXOptionsDB.getObject(
      "workspaces",
      workspaceID
    );
    if (workspace === undefined) return STRM;
    if (!workspace.personality) return STRM;
    return workspace.personality;
  },
  togglePinToolbar: async (workspaceID: string) => {
    const workspace: any | undefined = await FXOptionsDB.getObject(
      "workspaces",
      workspaceID
    );
    if (workspace === undefined) return;
    const { toolbarState } = workspace;
    if (!toolbarState || !toolbarState.pinned) {
      FXOptionsDB.put("workspaces", workspaceID, "toolbarState", {
        pinned: true
      });
    } else {
      FXOptionsDB.put("workspaces", workspaceID, "toolbarState", {
        pinned: false
      });
    }
  },
  getToolbarState: async (workspaceID: string): Promise<ToolbarState> => {
    const workspace: any | undefined = await FXOptionsDB.getObject(
      "workspaces",
      workspaceID
    );
    if (workspace === undefined)
      return { pinned: false, hovering: false, visible: false };
    return workspace.toolbarState;
  }
};
