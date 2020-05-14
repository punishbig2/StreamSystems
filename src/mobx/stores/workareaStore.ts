import { Currency } from "interfaces/currency";
import { Message } from "interfaces/message";
import { User, UserPreferences, CurrencyGroups } from "interfaces/user";
import { WorkareaStatus } from "stateDefs/workareaState";
import { observable, action, computed } from "mobx";
import { persist, create } from "mobx-persist";
import { API } from "API";

import latam from "groups/latam";

import strings from "locales";
import signalRManager from "signalR/signalRManager";
import { randomID } from "randomID";
import { WindowDef } from "mobx/stores/workspaceStore";
import { PresetWindow } from "groups/presetWindow";
import { defaultPreferences } from "stateDefs/defaultUserPreferences";
import persistStorage from "persistStorage";
import { STRM } from "stateDefs/workspaceState";
import { updateApplicationTheme } from "utils";
import { Strategy } from "../../interfaces/strategy";

export enum WindowTypes {
  PodTile = 1,
  MessageBlotter = 2,
  Empty = 3,
}

export enum WorkspaceType {
  Standard,
  MiddleOffice,
}

export interface WorkspaceDef {
  id: string;
  isDefault: boolean;
  name: string;
  personality: string;
  type: WorkspaceType;
}

export class WorkareaStore {
  @persist("object") @observable workspaces: { [k: string]: WorkspaceDef } = {};
  @persist @observable currentWorkspaceID: string | null = null;

  @observable.ref currencies: Currency[] = [];
  @observable.ref strategies: Strategy[] = [];
  @observable.ref tenors: string[] = [];
  @observable.ref banks: string[] = [];
  @observable status: WorkareaStatus = WorkareaStatus.Starting;
  @observable connected: boolean = false;
  @observable recentExecutions: Message[] = [];
  @persist("object")
  @observable
  preferences: UserPreferences = defaultPreferences;
  @observable user: User = {} as User;
  @observable loadingMessage?: string;
  @observable isCreatingWorkspace: boolean = false;

  private static getMapForCurrencyGroup(group: CurrencyGroups) {
    switch (group) {
      case CurrencyGroups.Default:
        return null;
      case CurrencyGroups.Latam:
        return latam;
    }
  }

  @computed
  public get personality(): string {
    const { workspaces, currentWorkspaceID: id } = this;
    if (id === null) return STRM;
    if (!workspaces[id]) throw new Error("this is completely unreasonable");
    return workspaces[id].personality;
  }

  @action.bound
  public setWorkspacePersonality(id: string, personality: string) {
    const { workspaces } = this;
    if (!workspaces[id]) return;
    workspaces[id].personality = personality;
  }

  private populateDefaultWorkspace(id: string, group: CurrencyGroups) {
    const map: {
      [k: string]: PresetWindow[];
    } | null = WorkareaStore.getMapForCurrencyGroup(group);
    if (map === null) return;
    const { workspaces } = persistStorage;
    const currencies: string[] = Object.keys(map);
    const windows: WindowDef[] = currencies.reduce(
      (accumulator: WindowDef[], currency: string): WindowDef[] => {
        const { pods } = persistStorage;
        const windowList: WindowDef[] = map[currency].map(
          ({ strategy, minimized, position }: PresetWindow): WindowDef => {
            const id: string = randomID("pods");
            // Force the initialization of a pod structure
            pods.setItem(id, JSON.stringify({ currency, strategy }));
            return {
              id: id,
              minimized: minimized,
              type: WindowTypes.PodTile,
              position: position,
              fitToContent: true,
            };
          }
        );
        return [...accumulator, ...windowList];
      },
      []
    );
    workspaces.setItem(id, JSON.stringify({ windows }));
  }

  @action.bound
  private internalAddWorkspace(group: CurrencyGroups) {
    const { workspaces } = this;
    const id: string = randomID("workspaces");
    // Populate the default stuff if needed
    this.populateDefaultWorkspace(id, group);
    // Create the workspace
    workspaces[id] = {
      id: id,
      isDefault: true,
      name: group,
      personality: STRM,
      type: WorkspaceType.Standard,
    };
    this.isCreatingWorkspace = false;
    this.currentWorkspaceID = id;
  }

  @action.bound
  public addStandardWorkspace(group: CurrencyGroups) {
    this.isCreatingWorkspace = true;
    // Do this after the `isCreatingWorkspace' takes effect
    setTimeout(() => this.internalAddWorkspace(group), 0);
  }

  @computed
  get currentWorkspace() {
    if (this.currentWorkspaceID === null) return null;
    const found: WorkspaceDef | undefined = this.workspaces[
      this.currentWorkspaceID
    ];
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
    if (this.currentWorkspaceID === null) return;
    const keys: string[] = Object.keys(workspaces);
    if (keys.length === 0) {
      this.currentWorkspaceID = null;
    } else if (workspaces[this.currentWorkspaceID] === undefined) {
      this.currentWorkspaceID = workspaces[keys[0]].id;
    }
  }

  @action.bound
  public async closeWorkspace(id: string) {
    const { workspaces } = this;
    const copy: { [k: string]: WorkspaceDef } = { ...workspaces };
    if (copy[id] !== undefined) delete copy[id];
    this.workspaces = copy;
    this.updateCurrentWorkspaceID();
  }

  @action.bound
  private loadTheme() {
    const { theme, colorScheme, font } = this.preferences;
    updateApplicationTheme(theme, colorScheme, font);
  }

  private async hydrate() {
    const hydrate = create({
      storage: persistStorage.workarea,
      jsonify: true,
    });
    await hydrate("workarea", this);
    // Update styles
    this.loadTheme();
  }

  private static cleanupUrl(email: string) {
    const { history, location } = window;
    const base: string = `${location.protocol}//${location.host}${location.pathname}`;
    // Replace the url with the same url but without parameters
    history.pushState({ email }, "", base);
  }

  @action.bound
  public async initialize(email: string) {
    try {
      this.status = WorkareaStatus.Starting;
      const users: any[] = await API.getUsers();
      // Find said user in the users array
      const user: User | undefined = users.find(
        (each: User) => each.email === email
      );
      if (user === undefined) {
        this.status = WorkareaStatus.UserNotFound;
      } else {
        await persistStorage.initialize(user);
        // Update local copy of preferences
        await this.hydrate();
        // Start connecting to the websocket
        this.user = user;
        this.loadingMessage = strings.EstablishingConnection;
        WorkareaStore.cleanupUrl(user.email);
        // Start the loading mode
        this.status = WorkareaStatus.Initializing;
        // Load currencies
        this.loadingMessage = strings.LoadingSymbols;
        this.currencies = await API.getSymbols();
        // Load strategies
        this.loadingMessage = strings.LoadingStrategies;
        this.strategies = await API.getProducts();
        // Load strategies
        this.loadingMessage = strings.LoadingTenors;
        this.tenors = await API.getTenors();
        // Load banks
        this.loadingMessage = strings.LoadingBanks;
        this.banks = await API.getBanks();
        // Connect the signal R client
        signalRManager.connect();
        // Try to connect
        signalRManager.setOnConnectedListener(() => {
          this.status = WorkareaStatus.Ready;
          this.loadingMessage = strings.Connected;
          this.connected = true;
        });
        signalRManager.setOnDisconnectedListener(() => {
          this.status = WorkareaStatus.Error;
          this.connected = false;
        });
      }
    } catch (error) {
      this.loadTheme();
      this.status = WorkareaStatus.Error;
    }
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
    if (workspace === undefined || !workspace.isDefault) return;
    workspaces[id].isDefault = false;
  }

  @action.bound
  public addRecentExecution(loadingMessage: Message) {
    const { recentExecutions } = this;
    recentExecutions.push(loadingMessage);
  }

  @action.bound
  public setPreferences(preferences: UserPreferences) {
    this.preferences = preferences;
  }

  @action.bound
  private internalAddMiddleOffice() {
    const { workspaces } = this;
    const id: string = randomID("workspaces");
    const middleOfficesCount: number = Object.values(workspaces).reduce(
      (count: number, workspace: WorkspaceDef) => {
        if (workspace.type === WorkspaceType.MiddleOffice) {
          return count + 1;
        } else {
          return count;
        }
      },
      0
    );
    // Create the workspace
    workspaces[id] = {
      id: id,
      isDefault: true,
      name: `Middle Office ${middleOfficesCount + 1}`,
      personality: STRM,
      type: WorkspaceType.MiddleOffice,
    };
    this.isCreatingWorkspace = false;
    this.currentWorkspaceID = id;
  }

  @action.bound
  public addMiddleOffice() {
    this.isCreatingWorkspace = true;
    setTimeout(this.internalAddMiddleOffice, 0);
  }
}

export default new WorkareaStore();
