import { Currency } from 'interfaces/currency';
import { Message } from 'interfaces/message';
import { User, UserWorkspace, CurrencyGroups } from 'interfaces/user';
import { WorkareaStatus } from 'redux/stateDefs/workareaState';
import { observable, action, computed } from 'mobx';
import { defaultProfile } from 'redux/reducers/userProfileReducer';
import { persist } from 'mobx-persist';
import { API } from 'API';

import latam from 'groups/latam';

import strings from 'locales';
import { SignalRManager } from 'redux/signalR/signalRManager';
import { randomID } from 'randomID';
import { WindowDef } from 'mobx/stores/workspace';
import { WindowTypes } from 'redux/constants/workareaConstants';
import { PresetWindow } from 'groups/presetWindow';

export interface WorkspaceDef {
  id: string;
  isDefault: boolean;
  name: string;
}

export class WorkareaStore {
  @persist('object') @observable workspaces: { [k: string]: WorkspaceDef } = {};
  @persist @observable currentWorkspaceID: string | null = null;

  @observable.ref currencies: Currency[] = [];
  @observable.ref tenors: string[] = [];
  @observable.ref strategies: string[] = [];
  @observable.ref banks: string[] = [];
  @observable status: WorkareaStatus = WorkareaStatus.Starting;
  @observable connected: boolean = false;
  @observable recentExecutions: Message[] = [];
  @observable userProfile: UserWorkspace = defaultProfile;
  @observable user: User | null = null;
  @observable message?: string;
  @observable isCreatingWorkspace: boolean = false;

  private static getMapForCurrencyGroup(group: CurrencyGroups) {
    switch (group) {
      case CurrencyGroups.Invalid:
        return null;
      case CurrencyGroups.Latam:
        return latam;
    }
  }

  private populateDefaultWorkspace(id: string, group: CurrencyGroups) {
    const map: { [k: string]: PresetWindow[] } | null = WorkareaStore.getMapForCurrencyGroup(group);
    if (map === null)
      return;
    const currencies: string[] = Object.keys(map);
    const windows: WindowDef[] = currencies.reduce((accumulator: WindowDef[], currency: string): WindowDef[] => {
      const windows: WindowDef[] = map[currency]
        .map(({ strategy, minimized, position }: PresetWindow): WindowDef => {
          const id: string = `WiN${currency}${strategy}${randomID()}`;
          // Force the initialization of a pod structure
          localStorage.setItem(`PoD${id}`, JSON.stringify({ currency, strategy }));
          return {
            id: id,
            minimized: minimized,
            type: WindowTypes.PodTile,
            position: position,
          };
        });
      return [...accumulator, ...windows];
    }, []);
    localStorage.setItem(id, JSON.stringify({ windows }));
  }

  @action.bound
  private internalAddWorkspace(group: CurrencyGroups) {
    const { workspaces } = this;
    const id: string = `WoS${group}${randomID()}`;
    // Populate the default stuff if needed
    this.populateDefaultWorkspace(id, group);
    // Create the workspace
    workspaces[id] = {
      id: id,
      isDefault: true,
      name: group,
    };
    this.isCreatingWorkspace = false;
    this.currentWorkspaceID = id;
  }

  @action.bound
  public addWorkspace(group: CurrencyGroups) {
    this.isCreatingWorkspace = true;
    setTimeout(() => this.internalAddWorkspace(group), 0);
  }

  @computed
  get currentWorkspace() {
    if (this.currentWorkspaceID === null)
      return null;
    const found: WorkspaceDef | undefined = this.workspaces[this.currentWorkspaceID];
    if (found) {
      return found;
    } else {
      return null;
    }
  }

  @action.bound
  public clearLastExecution() {
    this.recentExecutions = [];
  }

  private updateCurrentWorkspaceID() {
    const { workspaces } = this;
    if (this.currentWorkspaceID === null)
      return;
    const keys: string[] = Object.keys(workspaces);
    if (keys.length === 0) {
      this.currentWorkspaceID = null;
    } else if (workspaces[this.currentWorkspaceID] === undefined) {
      this.currentWorkspaceID = workspaces[keys[0]].id;
    }
  }

  @action.bound
  public closeWorkspace(id: string) {
    const { workspaces } = this;
    const copy: { [k: string]: WorkspaceDef } = { ...workspaces };
    if (copy[id] !== undefined)
      delete copy[id];
    this.workspaces = copy;
    this.updateCurrentWorkspaceID();
  }

  @action.bound
  public async initialize(email: string) {
    const signalRManager: SignalRManager = SignalRManager.getInstance();
    // Start the loading mode
    this.status = WorkareaStatus.Initializing;
    // Load currencies
    this.message = strings.LoadingSymbols;
    this.currencies = await API.getSymbols();
    // Load strategies
    this.message = strings.LoadingStrategies;
    this.strategies = await API.getProducts();
    // Load strategies
    this.message = strings.LoadingTenors;
    this.tenors = await API.getTenors();
    // Now load users information
    this.message = strings.LoadingUserData;
    const users: any[] = await API.getUsers();
    // Find said user in the users array
    const user: User | undefined = users.find((each: User) => each.email === email);
    if (user === undefined) {
      this.status = WorkareaStatus.UserNotFound;
    } else {
      this.user = user;
      this.message = strings.EstablishingConnection;
      // Update signal R manager
      signalRManager.setUser(user);
      // Connect the signal R client
      signalRManager.connect();
      // Try to connect
      signalRManager.setOnConnectedListener(() => {
        this.status = WorkareaStatus.Ready;
        this.connected = true;
      });
      signalRManager.setOnDisconnectedListener(() => {
        this.status = WorkareaStatus.Error;
        this.connected = false;
      });
    }
  };

  @action.bound
  public setWorkspace(id: string) {
    this.currentWorkspaceID = id;
  }

  @action.bound
  public setWorkspaceName(id: string, name: string) {
    const { workspaces } = this;
    if (workspaces[id] !== undefined) {
      workspaces[id] = { ...workspaces[id], name };
    }
  }

  @action.bound
  public setWorkspaceModified(id: string) {
    const { workspaces } = this;
    const workspace: WorkspaceDef = workspaces[id];
    if (workspace === undefined || !workspace.isDefault)
      return;
    workspaces[id].isDefault = false;
  }

  @action.bound
  public addRecentExecution(message: Message) {
    const { recentExecutions } = this;
    recentExecutions.push(message);
  }
}

export default new WorkareaStore();
