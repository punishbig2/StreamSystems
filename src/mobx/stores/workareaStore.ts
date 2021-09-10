import { API } from "API";

import strings from "locales";
import { action, autorun, computed, observable } from "mobx";
import { MiddleOfficeStore } from "mobx/stores/middleOfficeStore";
import { TradingWorkspaceStore } from "mobx/stores/tradingWorkspaceStore";
import moment from "moment-timezone";
import signalRManager from "signalR/signalRManager";
import { defaultPreferences } from "stateDefs/defaultUserPreferences";
import { WorkareaStatus } from "stateDefs/workareaState";
import { STRM } from "stateDefs/workspaceState";
import { Message } from "types/message";
import { Product, ProductSource } from "types/product";
import { OktaUser, Role } from "types/role";
import { Symbol } from "types/symbol";
import {
  CurrencyGroups,
  OtherUser,
  User,
  UserPreferences,
  UserInfo,
} from "types/user";
import { invalidWorkSchedule, WorkSchedule } from "types/workSchedule";
import { Workspace } from "types/workspace";
import { WorkspaceType } from "types/workspaceType";
import { updateApplicationTheme } from "utils/commonUtils";
import { parseAsNYTime } from "utils/parseAsNYTime";
import { PersistStorage } from "utils/persistStorage";
import { tenorToNumber } from "utils/tenorUtils";
import { parseVersionNumber } from "utils/versionNumberParser";

declare const GlobalApplicationVersion: string;

export const isTradingWorkspace = (
  workspace: TradingWorkspaceStore | any
): workspace is TradingWorkspaceStore => {
  if (workspace === undefined || workspace === null) return false;
  if (typeof workspace !== "object") return false;
  return "type" in workspace && workspace.type === WorkspaceType.Trading;
};

export const isMiddleOfficeWorkspace = (
  workspace: MiddleOfficeStore | any
): workspace is MiddleOfficeStore => {
  if (workspace === undefined || workspace === null) return false;
  if (typeof workspace !== "object") return false;
  return "type" in workspace && workspace.type === WorkspaceType.MiddleOffice;
};

export class WorkareaStore {
  @observable workspaces: ReadonlyArray<Workspace> = [];
  @observable currentWorkspaceIndex: number | null = null;
  @observable symbols: ReadonlyArray<Symbol> = [];
  @observable.ref products: ReadonlyArray<Product> = [];
  @observable.ref strategies: ReadonlyArray<Product> = [];
  @observable.ref tenors: ReadonlyArray<string> = [];
  @observable.ref banks: ReadonlyArray<string> = [];
  @observable status: WorkareaStatus = WorkareaStatus.Starting;
  @observable connected: boolean = false;
  @observable recentExecutions: Array<Message> = [];

  @observable.ref
  preferences: UserPreferences = defaultPreferences;
  @observable user: User = {} as User;
  @observable loadingMessage?: string;
  @observable loadingProgress: number = 0;
  @observable isCreatingWorkspace: boolean = false;

  @observable workspaceAccessDenied: boolean = false;
  @observable workspaceNotFound: boolean = false;
  @observable users: ReadonlyArray<OtherUser> = [];

  private symbolsMap: { [key: string]: Symbol } = {};
  private loadingStep: number = 0;

  private persistStorage?: PersistStorage;
  @observable isShowingNewVersionModal: boolean = false;
  @observable workSchedule: WorkSchedule = invalidWorkSchedule;

  public static fromJson(data: { [key: string]: any }): WorkareaStore {
    const { workspaces } = data;
    const newStore = new WorkareaStore();
    newStore.preferences = data.preferences;
    newStore.currentWorkspaceIndex = data.currentWorkspaceIndex;
    newStore.workspaces = workspaces.map(
      (data: { [key: string]: any }): Workspace => {
        const { type } = data;
        if (type === WorkspaceType.MiddleOffice) {
          return MiddleOfficeStore.fromJson(data);
        } else if (type === WorkspaceType.Trading) {
          return TradingWorkspaceStore.fromJson(data);
        } else {
          throw new Error(`unknown workspace type: ${type}`);
        }
      }
    );
    return newStore;
  }

  @computed
  public get serialized(): { [key: string]: any } {
    const { workspaces } = this;
    return {
      preferences: { ...this.preferences },
      currentWorkspaceIndex: this.currentWorkspaceIndex,
      workspaces: workspaces.map(
        (
          workspace: Workspace
        ): {
          [key: string]: any;
        } => workspace.serialized
      ),
    };
  }

  @computed
  public get personality(): string {
    const { workspaces, currentWorkspaceIndex } = this;
    if (currentWorkspaceIndex === null) return STRM;
    const workspace = workspaces[currentWorkspaceIndex];
    if (isTradingWorkspace(workspace)) {
      return workspace.personality;
    } else {
      return STRM;
    }
  }

  @computed
  get workspace(): Workspace | null {
    if (this.currentWorkspaceIndex === null) return null;
    const found: Workspace | undefined = this.workspaces[
      this.currentWorkspaceIndex
    ];
    if (found) {
      return found;
    } else {
      return null;
    }
  }

  private static cleanupUrl(email: string) {
    const { history, location } = window;
    const base: string = `${location.protocol}//${location.host}${location.pathname}`;
    // Replace the url with the same url but without parameters
    history.pushState({ email }, "", base);
  }

  @action.bound
  public addStandardWorkspace(group: CurrencyGroups) {
    this.isCreatingWorkspace = true;
    // Do this after the `isCreatingWorkspace' takes effect
    setTimeout(() => this.internalAddWorkspace(group), 0);
  }

  @action.bound
  public clearLastExecution() {
    this.recentExecutions = [];
  }

  @action.bound
  public async closeWorkspace(index: number) {
    const workspaces = [...this.workspaces];
    // Update current workspace id
    if (workspaces.length === 0) {
      this.currentWorkspaceIndex = null;
    } else {
      this.currentWorkspaceIndex = 0;
    }
    this.workspaces = [
      ...workspaces.slice(0, index),
      ...workspaces.slice(index + 1),
    ];
  }

  public isUserAllowedToSignIn(user: User): boolean {
    const { workSchedule } = this;
    const { roles } = user;
    if (roles.includes(Role.Broker) || roles.includes(Role.Admin)) {
      return true;
    }
    const bod = parseAsNYTime(workSchedule.trading_start_time);
    const eod = parseAsNYTime(workSchedule.trading_end_time);

    return eod.isAfter(moment()) && bod.isBefore(moment());
  }

  public async initialize(id: string) {
    this.loadingStep = 100 / 9;
    this.setStatus(WorkareaStatus.Starting);
    try {
      const user: User | undefined = await this.loadUser(id);
      if (user === undefined) {
        this.setStatus(WorkareaStatus.UserNotFound);
      } else {
        this.workSchedule = (await API.getTimeTable())[0];
        if (!this.isUserAllowedToSignIn(user)) {
          this.setStatus(WorkareaStatus.NotAllowedAtThisTime);
          return;
        } else {
          this.createSessionTimer();
        }
        const regions: ReadonlyArray<string> = await this.loadUserRegions(
          user.email
        );
        // Now the user object is complete
        this.user = { ...user, regions };
        this.persistStorage = new PersistStorage(this.user);
        // This is just for eye candy :)
        WorkareaStore.cleanupUrl(user.email);
        await this.checkVersion();
        // Load the saved state
        await this.initializePersistStorage();
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
        // Notify the user that we're done
        this.setStatus(WorkareaStatus.Welcome);
        // We want to show a welcome message first
        await new Promise<void>((resolve: () => void): void => {
          setTimeout(resolve, 1200);
        });
        // Switch the the normal view
        this.setStatus(WorkareaStatus.Ready);
      }
    } catch (error) {
      this.loadTheme();
      this.setStatus(WorkareaStatus.Error);
      console.warn(error);
    }
  }

  @action.bound
  public setWorkspace(index: number) {
    // FIXME: make this faster or smoother
    const { workspaces } = this;
    this.loadingStep = 1;
    this.workspaceAccessDenied = false;
    this.workspaceNotFound = false;
    const workspace: Workspace | undefined = workspaces[index];
    if (workspace === undefined) {
      this.workspaceNotFound = true;
    } else if (this.getUserAccessToWorkspace(workspace)) {
      this.currentWorkspaceIndex = index;
    } else {
      this.workspaceAccessDenied = true;
    }
  }

  @action.bound
  public setWorkspaceName(index: number, name: string) {
    const { workspaces } = this;
    const workspace: Workspace = workspaces[index];
    if (workspace === undefined) throw new Error("this must be impossible");
    workspace.setName(name);
    this.workspaces = [...workspaces];
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
  public addMiddleOffice() {
    this.isCreatingWorkspace = true;
    setTimeout(this.internalAddMiddleOffice, 0);
  }

  @action.bound
  public closeAccessDeniedView(): void {
    this.workspaceAccessDenied = false;
  }

  public findUserByEmail(email: string): OtherUser {
    const { users } = this;
    const found: OtherUser | undefined = users.find(
      (user: OtherUser): boolean => {
        if (user.email === undefined) {
          return false;
        } else if (email === undefined) {
          return false;
        }
        return user.email.toLowerCase() === email.toLowerCase();
      }
    );
    if (found === undefined) {
      console.warn(
        `we tried to find \`${email}' in the list of users from the server but it's not in it`,
        users
      );
      return {
        email: "unknown user",
        firm: "unknown firm",
      };
    }
    return found;
  }

  @action.bound
  private internalAddMiddleOffice(): void {
    const { workspaces } = this;
    // Create the workspace
    this.currentWorkspaceIndex = workspaces.length;
    this.workspaces = [...workspaces, new MiddleOfficeStore()];
    this.isCreatingWorkspace = false;
  }

  @action.bound
  private internalAddWorkspace(group: CurrencyGroups) {
    const { workspaces } = this;
    // Create the workspace
    this.currentWorkspaceIndex = workspaces.length;
    this.workspaces = [...workspaces, new TradingWorkspaceStore()];
    this.isCreatingWorkspace = false;
    // TODO: currently not being used but could be in the future
    //       again
    void group;
  }

  @action.bound
  private loadTheme() {
    const { theme, colorScheme, font } = this.preferences;
    updateApplicationTheme(theme, colorScheme, font);
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
  private async loadUser(id: string): Promise<User | undefined> {
    this.updateLoadingProgress(strings.StartingUp);

    const oktaUser: OktaUser = await API.getUser(id);
    const userInfo: UserInfo = await API.getUserInfo(oktaUser.email);
    const me = userInfo[0];
    // Find said user in the users array
    if (me === undefined) {
      return undefined;
    } else {
      const { roles } = oktaUser;
      this.users = await API.getAllUsers(oktaUser.email);
      const self: User = {
        email: me.email,
        firm: me.firm,
        firstname: me.firstname,
        lastname: me.lastname,
        regions: await API.getUserRegions(oktaUser.email),
        // Add broker role
        roles: [...roles, ...(me.isbroker ? [Role.Broker] : [])],
      };

      return self;
    }
  }

  private async loadUserRegions(email: string): Promise<ReadonlyArray<string>> {
    this.updateLoadingProgress(strings.LoadingRegions);
    return API.getUserRegions(email);
  }

  private async initializePersistStorage(): Promise<void> {
    const { persistStorage } = this;
    if (persistStorage === null || persistStorage === undefined) {
      throw new Error("persist storage not set");
    }
    this.updateLoadingProgress(strings.LoadingRegions);
    // Initialize the persistStorage object
    const savedStore = await persistStorage.read();
    this.preferences = savedStore.preferences;
    this.workspaces = savedStore.workspaces;
    this.currentWorkspaceIndex = savedStore.currentWorkspaceIndex;
    autorun((): void => {
      const { persistStorage } = this;
      if (persistStorage === null || persistStorage === undefined) {
        throw new Error("persist storage not set");
      }
      // Save the changes in the store (and all it's children)
      void persistStorage.persist(this.serialized);
    });
  }

  private async loadSystemSymbols(): Promise<void> {
    this.updateLoadingProgress(strings.LoadingSymbols);
    this.symbols = await API.getSymbols();
  }

  private async createSymbolsMap(): Promise<void> {
    this.symbolsMap = this.mapSymbolsWithIds();
  }

  private async loadSystemStrategies(): Promise<void> {
    this.updateLoadingProgress(strings.LoadingStrategies);
    this.products = await API.getProductsEx();
    this.strategies = this.products.filter(
      (product: Product): boolean => product.source === ProductSource.Electronic
    );
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
    if (signalRManager.connect()) {
      // Try to connect
      signalRManager.setOnConnectedListener(() => {
        this.status = WorkareaStatus.Ready;
        this.loadingMessage = strings.Connected;
        this.connected = true;
      });
      signalRManager.setOnDisconnectedListener(() => {
        // this.status = WorkareaStatus.Error;
        this.connected = false;
      });
    }
  }

  @action.bound
  private setStatus(status: WorkareaStatus) {
    this.loadingProgress = 0;
    this.status = status;
  }

  private getUserAccessToWorkspace(workspace: Workspace): boolean {
    const { roles } = this.user;
    switch (workspace.type) {
      case WorkspaceType.MiddleOffice:
        return (
          roles.includes(Role.MiddleOffice) ||
          roles.includes(Role.Broker) ||
          roles.includes(Role.Admin)
        );
      case WorkspaceType.Trading:
        return roles.includes(Role.Broker) || roles.includes(Role.Trader);
    }
    return false;
  }

  public async checkVersion(): Promise<void> {
    const response = await fetch("current-version");
    if (response.status !== 200) {
      throw new Error("cannot fetch the version number file");
    }
    try {
      const latest = parseVersionNumber(await response.text());
      const active = parseVersionNumber(GlobalApplicationVersion);
      if (latest > active) {
        this.showNewVersionModal();
      }
    } catch {}
  }

  @action.bound
  private showNewVersionModal(): void {
    this.isShowingNewVersionModal = true;
  }

  public upgradeApplication(): void {
    window.location.reload();
  }

  private createSessionTimer(): void {
    const { workSchedule } = this;
    const tradingEndTime = moment(workSchedule.trading_end_time, "HH:mm:SS");
    setTimeout((): void => {
      this.setStatus(WorkareaStatus.NotAllowedAtThisTime);
    }, tradingEndTime.diff(moment()));
  }
}

export default new WorkareaStore();
