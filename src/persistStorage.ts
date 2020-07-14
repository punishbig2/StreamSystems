import { User } from "interfaces/user";
import { API } from "API";
import { WindowDef } from "mobx/stores/workspaceStore";

class Storage {
  private engine: PersistStorage;
  private domain: string;

  constructor(engine: PersistStorage, name: string) {
    this.engine = engine;
    this.domain = name;
  }

  public async getItem(key: string): Promise<string | null> {
    const { engine, domain } = this;
    const item: any | null = await engine.getItem(domain, key);
    if (item === null) return null;
    return JSON.stringify(item);
  }

  public async setItem(key: string, value: string): Promise<void> {
    const { engine, domain } = this;
    return engine.setItem(domain, key, JSON.parse(value));
  }

  public async removeItem(key: string): Promise<void> {
    throw new Error("this is not needed");
  }
}

class PersistStorage {
  private user: User | null = null;
  private pendingOperation: number = setTimeout(() => null, 0);

  public workarea: Storage = new Storage(this, "workarea");
  public workspaces: Storage = new Storage(this, "workspaces");
  public windows: Storage = new Storage(this, "windows");
  public pods: Storage = new Storage(this, "pods");
  public tables: Storage = new Storage(this, "tables");
  public data: { [k: string]: any } = {};

  public async getItem(domainKey: string, key: string): Promise<any> {
    const { data } = this;
    const domain: any | undefined = data[domainKey];
    if (domain && domain[key]) {
      return domain[key];
    }
    return null;
  }

  public async setItem(
    domainKey: string,
    key: string,
    object: any
  ): Promise<void> {
    const { data } = this;
    const domain: any = data[domainKey] || {};
    // Update the local memory item so that if it's queried
    // it has the most recent value
    this.data = { ...data, [domainKey]: { ...domain, [key]: object } };
    // Send to the backend
    this.persist();
  }

  private getCleanedData() {
    // Create a local copy
    const cleanData = { ...this.data };
    const {
      workarea: { workspaces },
    } = cleanData.workarea;
    if (workspaces && cleanData.workspaces) {
      const list: any[] = Object.values(workspaces);
      cleanData.workspaces = list.reduce(
        (cleanedUpWorkspaces: any, workspace: any): any => {
          cleanedUpWorkspaces[workspace.id] =
            cleanData.workspaces[workspace.id];
          return cleanedUpWorkspaces;
        },
        {}
      );
    }
    if (cleanData.workspaces) {
      const list: any[] = Object.values(cleanData.workspaces);
      const ids = list.reduce((list: string[], workspace: any): string[] => {
        if (!workspace) return list;
        const { windows } = workspace;
        if (!windows) return list;
        return [...list, ...windows.map((w: WindowDef) => w.id)];
      }, []);
      if (cleanData.windows) {
        cleanData.windows = ids.reduce(
          (cleanedUpWindows: any, id: string): any => {
            cleanedUpWindows[id] = cleanData.windows[id];
            return cleanedUpWindows;
          },
          {}
        );
      }
      if (cleanData.pods) {
        cleanData.pods = ids.reduce((cleanedUpPods: any, id: string): any => {
          cleanedUpPods[id] = cleanData.pods[id];
          return cleanedUpPods;
        }, {});
      }
    }
    return cleanData;
  }

  private persist() {
    const { user } = this;
    const finalData = this.getCleanedData();
    if (user) {
      // Cancel any pending updates
      clearTimeout(this.pendingOperation);
      // Schedule an update
      this.pendingOperation = setTimeout(() => {
        API.saveUserProfile({
          useremail: user.email,
          workspace: JSON.stringify(finalData),
        });
      }, 150);
    }
  }

  public async initialize(user: User) {
    const [workspace]: [{ workspace: any }] = await API.getUserProfile(
      user.email
    );
    this.user = user;
    if (!workspace) return;
    try {
      this.data = JSON.parse(workspace.workspace);
    } catch {
      this.data = {};
    }
  }

  public getCCYGroup() {
    const { workarea: root } = this.data;
    if (!root) return "LATAM";
    const {
      workarea: { workarea },
    } = this.data;
    if (!workarea) return "LATAM";
    const { preferences } = workarea;
    if (!preferences) return "LATAM";
    const { ccyGroup } = preferences;
    if (!ccyGroup)
      return "LATAM";
    if (ccyGroup.trim() === "")
      return "LATAM";
    return ccyGroup;
  }
}

export default new PersistStorage();
