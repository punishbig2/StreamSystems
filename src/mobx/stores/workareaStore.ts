import { API } from "API";

import strings from "locales";
import { action, autorun, computed, observable } from "mobx";
import { MiddleOfficeStore } from "mobx/stores/middleOfficeStore";
import { TradingWorkspaceStore } from "mobx/stores/tradingWorkspaceStore";
import signalRManager from "signalR/signalRManager";
import { defaultPreferences } from "stateDefs/defaultUserPreferences";
import { WorkareaStatus } from "stateDefs/workareaState";
import { STRM } from "stateDefs/workspaceState";
import { Message } from "types/message";
import { serializeObject, unserializeObject } from "types/persistable";
import { Product, ProductSource } from "types/product";
import { OktaUser, Role } from "types/role";
import { Symbol } from "types/symbol";
import { CurrencyGroups, User, UserPreferences } from "types/user";
import { Workspace } from "types/workspace";
import { WorkspaceType } from "types/workspaceType";
import { updateApplicationTheme } from "utils/commonUtils";
import { PersistStorage } from "utils/persistStorage";
import { tenorToNumber } from "utils/tenorUtils";

export const isTradingWorkspace = (
  workspace: TradingWorkspaceStore | any
): workspace is TradingWorkspaceStore => {
  if (workspace === undefined || workspace === null) return false;
  if (typeof workspace !== "object") return false;
  return "type" in workspace && workspace.type === WorkspaceType.Trading;
};

export class WorkareaStore {
  @observable workspaces: {
    [key: string]: Workspace;
  } = {};
  @observable currentWorkspaceID: string | null = null;

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

  private users: ReadonlyArray<User> = [];
  private symbolsMap: { [key: string]: Symbol } = {};
  private loadingStep: number = 0;

  private persistStorage = new PersistStorage<WorkareaStore>();
  public static fromJson(data: { [key: string]: any }): WorkareaStore {
    const newStore = new WorkareaStore();
    newStore.preferences = data.preferences;
    newStore.currentWorkspaceID = data.currentWorkspaceID;
    newStore.workspaces = unserializeObject<Workspace>(
      data.workspaces,
      (data: { [key: string]: any }): Workspace => {
        const { id } = data;
        if (id.startsWith("mo")) {
          return MiddleOfficeStore.fromJson(data);
        } else if (id.startsWith("ws")) {
          return TradingWorkspaceStore.fromJson(data);
        } else {
          console.warn(`cannot understand workspace id ${id}`);
          return {} as Workspace;
        }
      }
    );
    return newStore;
  }

  @computed
  public get serialized(): { [key: string]: any } {
    return {
      preferences: { ...this.preferences },
      currentWorkspaceID: this.currentWorkspaceID,
      workspaces: serializeObject<Workspace>(this.workspaces),
    };
  }

  @computed
  public get personality(): string {
    const { workspaces, currentWorkspaceID } = this;
    if (currentWorkspaceID === null) return STRM;
    const workspace = workspaces[currentWorkspaceID];
    if (isTradingWorkspace(workspace)) {
      return workspace.personality;
    } else {
      return STRM;
    }
  }

  @computed
  get workspace(): Workspace | null {
    if (this.currentWorkspaceID === null) return null;
    const found: Workspace | undefined = this.workspaces[
      this.currentWorkspaceID
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
  public async closeWorkspace(id: string) {
    const workspaces = { ...this.workspaces };
    if (id in workspaces) {
      delete workspaces[id];
    }
    // Update current workspace id
    const ids = [...Object.keys(this.workspaces)];
    if (ids.length === 0) {
      this.currentWorkspaceID = null;
    } else {
      this.currentWorkspaceID = ids[0];
    }
    this.workspaces = workspaces;
  }

  public async initialize(id: string) {
    this.loadingStep = 100 / 9;
    this.setStatus(WorkareaStatus.Starting);
    try {
      const user: User | undefined = await this.loadUser(id);
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

        window.addEventListener(
          "focus",
          (): Promise<void> => this.connectToSignalR()
        );

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
    const { workspaces } = this;
    this.workspaceAccessDenied = false;
    this.workspaceNotFound = false;
    const workspace: Workspace | undefined = workspaces[id];
    if (workspace === undefined) {
      this.workspaceNotFound = true;
    } else if (this.getUserAccessToWorkspace(workspace)) {
      this.currentWorkspaceID = id;
    } else {
      this.workspaceAccessDenied = true;
    }
  }

  @action.bound
  public setWorkspaceName(id: string, name: string) {
    const { workspaces } = this;
    const workspace: Workspace = workspaces[id];
    if (workspace === undefined) throw new Error("this must be impossible");
    workspace.setName(name);
    this.workspaces = { ...workspaces, [id]: workspace };
  }

  @action.bound
  public setWorkspaceModified(id: string) {
    const { workspaces } = this;
    const workspace = workspaces[id];
    if (workspace === undefined) throw new Error("this must be impossible");
    if (typeof workspace.setModified === "function") {
      workspace.setModified(true);
    }
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
    if (ccyGroup !== preferences.ccyGroup) {
      /*API.getSymbols(persistStorage.getCCYGroup()).then(
        (currencies: Symbol[]) => (this.symbols = currencies)
      );*/
    }
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

  public findUserByEmail(email: string): User {
    const { users } = this;
    const found: User | undefined = users.find((user: User): boolean => {
      if (user.email === undefined) {
        return false;
      } else if (email === undefined) {
        return false;
      }
      return user.email.toLowerCase() === email.toLowerCase();
    });
    if (found === undefined) {
      console.warn(
        `we tried to find \`${email}' in the list of users from the server but it's not in it`,
        users
      );
      return {
        email: "unknown user",
        firm: "unknown firm",
        regions: [],
        roles: [],
        firstname: "unknown",
        lastname: "unknown",
      };
    }
    return found;
  }

  @action.bound
  private internalAddMiddleOffice(): void {
    const { workspaces } = this;
    const id: string = `mo${Math.round(1e8 * Math.random())}`;
    // Create the workspace
    this.workspaces = { ...workspaces, [id]: new MiddleOfficeStore(id) };
    this.isCreatingWorkspace = false;
    this.currentWorkspaceID = id;
  }

  @action.bound
  private internalAddWorkspace(group: CurrencyGroups) {
    const { workspaces } = this;
    const id: string = `ws${Math.round(1e8 * Math.random())}`;
    // Create the workspace
    this.workspaces = { ...workspaces, [id]: new TradingWorkspaceStore(id) };
    this.isCreatingWorkspace = false;
    this.currentWorkspaceID = id;
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
    // Get the list of all users
    const users: User[] = await API.getUsers();
    this.users = users;
    if (
      !/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/.test(
        id
      )
    ) {
      const oktaUser: OktaUser = await API.getUser(id);
      // Find said user in the users array
      const user: User | undefined = users.find(
        (each: User) => each.email === oktaUser.email
      );
      if (user === undefined) {
        return undefined;
      } else {
        const { roles } = oktaUser;
        return { ...user, roles };
      }
    } else {
      // Find said user in the users array
      const user: any | undefined = users.find(
        (each: User): boolean => each.email === id
      );
      if (user === undefined) {
        return undefined;
      } else {
        return {
          ...user,
          roles: [
            ...(user.isbroker ? [Role.Broker] : []),
            ...(user.ismiddleoffice ? [Role.MiddleOffice] : []),
            ...(!user.isbroker && !user.ismiddleoffice ? [Role.Trader] : []),
          ],
        };
      }
    }
  }

  private async loadUserRegions(email: string): Promise<ReadonlyArray<string>> {
    this.updateLoadingProgress(strings.LoadingRegions);
    return API.getUserRegions(email);
  }

  private async initializePersistStorage(user: User): Promise<void> {
    const { persistStorage } = this;
    this.updateLoadingProgress(strings.LoadingRegions);
    // Initialize the persistStorage object
    const savedStore = await persistStorage.read(user);
    this.preferences = savedStore.preferences;
    this.workspaces = savedStore.workspaces;
    this.currentWorkspaceID = savedStore.currentWorkspaceID;
    autorun((): void => {
      const { persistStorage } = this;
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
        this.status = WorkareaStatus.Error;
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
}

export default new WorkareaStore();
