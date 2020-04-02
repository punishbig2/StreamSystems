import { Currency } from 'interfaces/currency';
import { Strategy } from 'interfaces/strategy';
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

export interface WorkspaceDef {
  id: string;
  isDefault: boolean;
  name: string;
}

export class WorkareaStore {
  @persist('object') @observable workspaces: { [k: string]: WorkspaceDef } = {};
  @persist @observable currentWorkspaceID: string | null = null;

  @observable symbols: Currency[] = [];
  @observable tenors: string[] = [];
  @observable products: Strategy[] = [];
  @observable banks: string[] = [];
  @observable messages: Message[] = [];
  @observable status: WorkareaStatus = WorkareaStatus.Starting;
  @observable connected: boolean = false;
  @observable recentExecutions: Message[] = [];
  @observable userProfile: UserWorkspace = defaultProfile;
  @observable user: User | null = null;
  @observable message?: string;

  private static getMapForCurrencyGroup(group: CurrencyGroups) {
    switch (group) {
      case CurrencyGroups.Invalid:
        return null;
      case CurrencyGroups.Latam:
        return latam;
    }
  }

  private populateDefaultWorkspace(id: string, group: CurrencyGroups) {
    const map: { [k: string]: string[] } | null = WorkareaStore.getMapForCurrencyGroup(group);
    if (map === null)
      return;
    const symbols: string[] = Object.keys(map);
    const windows: WindowDef[] = symbols.reduce((accumulator: WindowDef[], currency: string): WindowDef[] => {
      const windows: WindowDef[] = map[currency]
        .map((strategy: string): WindowDef => {
          const id: string = `WiN${currency}${strategy}${randomID()}`;
          // Force the initialization of a pod structure
          localStorage.setItem(`PoD${id}`, JSON.stringify({ currency, strategy }));
          return {
            id: id,
            type: WindowTypes.PodTile,
          };
        });
      return [...accumulator, ...windows];
    }, []);
    localStorage.setItem(id, JSON.stringify({ windows }));
  }

  @action.bound
  public addWorkspace(group: CurrencyGroups) {
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
    // Activate it
    this.currentWorkspaceID = id;
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
    // Load symbols
    this.message = strings.LoadingSymbols;
    this.symbols = await API.getSymbols();
    // Load strategies
    this.message = strings.LoadingStrategies;
    this.products = await API.getProducts();
    // Load strategies
    this.message = strings.LoadingTenors;
    this.tenors = await API.getTenors();
    // Load blotter messages
    this.message = strings.LoadingMessages;
    this.messages = await API.getMessagesSnapshot(email, Date.now());
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
  public onMessage(message: Message) {
    const { messages } = this;
    messages.push(message);
  }

  @action.bound
  public subscribeToBlotterMessages(email: string) {
    const signalRManager: SignalRManager = SignalRManager.getInstance();
    // Subscribe to signal r messages
    return signalRManager.setMessagesListener('*', this.onMessage);
  }

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
}

