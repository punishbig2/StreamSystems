import { API } from "API";

import latam from "groups/latam";
import { PresetWindow } from "groups/presetWindow";

import strings from "locales";
import { action, computed, observable } from "mobx";
import { create, persist } from "mobx-persist";
import dealsStore from "mobx/stores/dealsStore";
import { WindowDef } from "mobx/stores/workspaceStore";
import persistStorage from "persistStorage";
import { randomID } from "randomID";
import signalRManager from "signalR/signalRManager";
import { defaultPreferences } from "stateDefs/defaultUserPreferences";
import { WorkareaStatus } from "stateDefs/workareaState";
import { STRM } from "stateDefs/workspaceState";
import { Message } from "types/message";
import { Strategy } from "types/strategy";
import { Symbol } from "types/symbol";
import { CurrencyGroups, User, UserPreferences } from "types/user";
import { updateApplicationTheme } from "utils";
import { tenorToNumber } from "utils/tenorUtils";

export enum WindowTypes {
  PodTile = 1,
  MessageBlotter = 2,
  Empty = 3,
}

export enum WorkspaceType {
  Trading,
  MiddleOffice,
}

export interface WorkspaceDef {
  readonly id: string;
  readonly name: string;
  personality: string;
  isDefault: boolean;
  readonly type: WorkspaceType;
}

export class WorkareaStore {
  @persist("object") @observable workspaces: { [k: string]: WorkspaceDef } = {};
  @persist @observable currentWorkspaceID: string | null = null;

  @observable symbols: ReadonlyArray<Symbol> = [];
  @observable.ref strategies: ReadonlyArray<Strategy> = [];
  @observable.ref tenors: ReadonlyArray<string> = [];
  @observable.ref banks: ReadonlyArray<string> = [];
  @observable status: WorkareaStatus = WorkareaStatus.Starting;
  @observable connected: boolean = false;
  @observable recentExecutions: Array<Message> = [];
  @persist("object")
  @observable
  preferences: UserPreferences = defaultPreferences;
  @observable user: User = {} as User;
  @observable loadingMessage?: string;
  @observable loadingProgress: number = 0;
  @observable isCreatingWorkspace: boolean = false;

  private symbolsMap: { [key: string]: Symbol } = {};
  private loadingStep: number = 0;

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
  public setWorkspacePersonality(id: string, personality: string): void {
    const { workspaces } = this;
    if (!workspaces[id]) return;
    workspaces[id].personality = personality;
  }

  private populateDefaultWorkspace(id: string, group: CurrencyGroups): void {
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
            pods
              .setItem(id, JSON.stringify({ currency, strategy }))
              .then(() => {});
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
    workspaces.setItem(id, JSON.stringify({ windows })).then(() => {});
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
      type: WorkspaceType.Trading,
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

  private mapSymbolsWithIds() {
    const { symbols } = this;
    return symbols.reduce((map: { [key: string]: Symbol }, symbol: Symbol): {
      [key: string]: Symbol;
    } => {
      map[symbol.symbolID] = symbol;
      return map;
    }, {});
  }

  @action.bound
  private updateLoadingProgress(message: string) {
    this.loadingMessage = message;
    this.loadingProgress += this.loadingStep;
    if (this.loadingProgress > 100) this.loadingProgress = 100;
  }

  @action.bound
  private async loadUser(email: string): Promise<User | undefined> {
    this.updateLoadingProgress(strings.StartingUp);
    // Get the list of all users
    const users: any[] = await API.getUsers();
    // Find said user in the users array
    return users.find((each: User) => each.email === email);
  }

  private async loadUserRegions(email: string): Promise<ReadonlyArray<string>> {
    this.updateLoadingProgress(strings.LoadingRegions);
    return API.getUserRegions(email);
  }

  private async initializePersistStorage(user: User): Promise<void> {
    this.updateLoadingProgress(strings.LoadingRegions);
    // Initialize the persistStorage object
    await persistStorage.initialize(user);
    // Update local copy of preferences
    await this.hydrate();
  }

  private async loadSystemSymbols(): Promise<void> {
    this.updateLoadingProgress(strings.LoadingSymbols);
    this.symbols = await API.getSymbols();
    // Update deals list
    dealsStore.loadDeals();
  }

  private async createSymbolsMap(): Promise<void> {
    this.symbolsMap = this.mapSymbolsWithIds();
  }

  private async loadSystemStrategies(): Promise<void> {
    this.updateLoadingProgress(strings.LoadingStrategies);
    this.strategies = await API.getProducts();
  }

  private async loadSystemTenors(): Promise<void> {
    this.updateLoadingProgress(strings.LoadingTenors);
    const tenors: string[] = await API.getTenors();
    this.tenors = tenors.sort(
      (t1: string, t2: string) => tenorToNumber(t1) - tenorToNumber(t2)
    );
  }

  private async loadSystemBanks(): Promise<void> {
    this.updateLoadingProgress(strings.LoadingBanks);
    this.banks = await API.getBanks();
  }

  private async connectToSignalR(): Promise<void> {
    this.updateLoadingProgress(strings.EstablishingConnection);
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

  @action.bound
  private setStatus(status: WorkareaStatus) {
    this.status = status;
  }

  public async initialize(email: string) {
    this.loadingStep = 100 / 9;
    this.setStatus(WorkareaStatus.Starting);
    try {
      const user: User | undefined = await this.loadUser(email);
      if (user === undefined) {
        this.setStatus(WorkareaStatus.UserNotFound);
      } else {
        const regions: ReadonlyArray<string> = await this.loadUserRegions(
          user.email
        );
        // Now the user object is complete
        this.user = { ...user, regions };
        // This is just for eye candy :)
        WorkareaStore.cleanupUrl(user.email);
        // Load the saved state
        await this.initializePersistStorage(user);
        // Set the loading mode
        this.setStatus(WorkareaStatus.Initializing);
        // Start loading stuff
        await this.loadSystemSymbols();
        await this.createSymbolsMap();
        await this.loadSystemStrategies();
        await this.loadSystemTenors();
        await this.loadSystemBanks();
        await this.connectToSignalR();
        // We are done now
        this.updateLoadingProgress(strings.Connected);
        // Please wait until progress shows 100%
        setTimeout(() => {
          // Notify the user that we're done
          this.setStatus(WorkareaStatus.Welcome);
          // We want to show a welcome message first
          setTimeout(() => {
            // Switch the the normal view
            this.setStatus(WorkareaStatus.Ready);
          }, 800);
        }, 0);
      }
    } catch (error) {
      this.loadTheme();
      this.setStatus(WorkareaStatus.Error);
      console.warn(error);
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
    const { ccyGroup } = this.preferences;
    this.preferences = preferences;
    console.log(this.preferences.theme);
    if (ccyGroup !== preferences.ccyGroup) {
      API.getSymbols(persistStorage.getCCYGroup()).then(
        (currencies: Symbol[]) => (this.symbols = currencies)
      );
    }
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

  public findSymbolById(id: string): Symbol | undefined {
    const { symbolsMap } = this;
    return symbolsMap[id];
  }
}

export default new WorkareaStore();
