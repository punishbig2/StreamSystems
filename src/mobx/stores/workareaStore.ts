import { API } from 'API';
import strings from 'locales';
import { action, autorun, computed, makeObservable, observable } from 'mobx';
import { MiddleOfficeStore } from 'mobx/stores/middleOfficeStore';
import { TradingWorkspaceStore } from 'mobx/stores/tradingWorkspaceStore';
import moment from 'moment-timezone';
import signalRManager from 'signalR/signalRClient';
import { defaultPreferences } from 'stateDefs/defaultUserPreferences';
import { WorkareaStatus } from 'stateDefs/workareaState';
import { NONE } from 'stateDefs/workspaceState';
import { FXSymbol } from 'types/FXSymbol';
import { OrderTypes } from 'types/mdEntry';
import * as message from 'types/message';
import { Order } from 'types/order';
import { PodRow, PodRowStatus } from 'types/podRow';
import { Product, ProductSource } from 'types/product';
import { hasRole, OktaUser, Role } from 'types/role';
import * as users from 'types/user';
import * as schedule from 'types/workSchedule';
import { Workspace } from 'types/workspace';
import { WorkspaceType } from 'types/workspaceType';
import { updateApplicationTheme } from 'utils/commonUtils';
import { parseAsNYTime } from 'utils/parseAsNYTime';
import { PersistStorage } from 'utils/persistStorage';
import { tenorToNumber } from 'utils/tenorUtils';
import { parseVersionNumber } from 'utils/versionNumberParser';
import { version } from 'version';

export const isTradingWorkspace = (
  workspace: TradingWorkspaceStore | any
): workspace is TradingWorkspaceStore => {
  if (workspace === undefined || workspace === null) return false;
  if (typeof workspace !== 'object') return false;
  return 'type' in workspace && workspace.type === WorkspaceType.Trading;
};

export const isMiddleOfficeWorkspace = (
  workspace: MiddleOfficeStore | any
): workspace is MiddleOfficeStore => {
  if (workspace === undefined || workspace === null) return false;
  if (typeof workspace !== 'object') return false;
  return 'type' in workspace && workspace.type === WorkspaceType.MiddleOffice;
};

export class WorkareaStore {
  public workspaces: readonly Workspace[] = [];
  public currentWorkspaceIndex: number | null = null;
  public symbols: readonly FXSymbol[] = [];
  public products: readonly Product[] = [];
  public strategies: readonly Product[] = [];
  public tenors: readonly string[] = [];
  public banks: readonly string[] = [];
  public status: WorkareaStatus = WorkareaStatus.Starting;
  public connected = false;
  public recentExecutions: message.Message[] = [];

  public defaultOrders: Record<string, readonly Order[]> = {};
  public defaultPodRows: Record<string, PodRow> = {};

  public preferences: users.UserPreferences = defaultPreferences;
  public user: users.User = {} as users.User;
  public loadingMessage?: string;
  public loadingProgress = 0;
  public isCreatingWorkspace = false;

  public workspaceAccessDenied = false;
  public workspaceNotFound = false;
  public users: readonly users.OtherUser[] = [];

  public symbolsMap: { [key: string]: FXSymbol } = {};
  public loadingStep = 0;

  public persistStorage?: PersistStorage;
  public lastVersionCheckTimestamp = 0;

  public isShowingNewVersionModal = false;
  public workSchedule: schedule.WorkSchedule = schedule.invalidWorkSchedule;

  constructor() {
    makeObservable(this, {
      workspaces: observable,
      currentWorkspaceIndex: observable,
      symbols: observable,
      products: observable.ref,
      strategies: observable.ref,
      tenors: observable.ref,
      banks: observable.ref,
      status: observable,
      connected: observable,
      recentExecutions: observable,
      defaultOrders: observable.ref,
      defaultPodRows: observable.ref,
      preferences: observable.ref,
      user: observable,
      loadingMessage: observable,
      loadingProgress: observable,
      isCreatingWorkspace: observable,
      workspaceAccessDenied: observable,
      workspaceNotFound: observable,
      users: observable,
      isShowingNewVersionModal: observable,
      workSchedule: observable,
      serialized: computed,
      personality: computed,
      workspace: computed,
      addStandardWorkspace: action.bound,
      clearLastExecution: action.bound,
      closeWorkspace: action.bound,
      setWorkspace: action.bound,
      setWorkspaceName: action.bound,
      addRecentExecution: action.bound,
      setPreferences: action.bound,
      addMiddleOffice: action.bound,
      closeAccessDeniedView: action.bound,
      internalAddMiddleOffice: action.bound,
      internalAddWorkspace: action.bound,
      loadTheme: action.bound,
      updateLoadingProgress: action.bound,
      loadUser: action.bound,
      loadSystemSymbols: action.bound,
      createSymbolsMap: action.bound,
      loadSystemStrategies: action.bound,
      loadSystemTenors: action.bound,
      loadSystemBanks: action.bound,
      setStatus: action.bound,
      showNewVersionModal: action.bound,
      updateDefaultOrders: action.bound,
      updateDefaultPodRows: action.bound,
      onConnectedHandler: action.bound,
      onDisconnectedHandler: action.bound,
      setCurrentWorkspaceIndex: action.bound,
      setWorkspaces: action.bound,
      setUser: action.bound,
    });
  }

  public get effectiveFirm(): string {
    const { user, personality } = this;
    const { roles } = user;

    if (hasRole(roles, Role.Broker)) {
      return personality;
    }

    return user.firm;
  }

  public static fromJson(data: { [key: string]: any }): WorkareaStore {
    const { workspaces } = data;
    const newStore = new WorkareaStore();

    newStore.preferences = data.preferences;
    newStore.currentWorkspaceIndex = data.currentWorkspaceIndex;
    newStore.workspaces = workspaces.map((data: { [key: string]: any }): Workspace => {
      const { type } = data;
      if (type === WorkspaceType.MiddleOffice) {
        return MiddleOfficeStore.fromJson(data);
      } else if (type === WorkspaceType.Trading) {
        return TradingWorkspaceStore.fromJson(data);
      } else {
        throw new Error(`unknown workspace type: ${type}`);
      }
    });
    return newStore;
  }

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

  public get personality(): string {
    const { workspaces, currentWorkspaceIndex } = this;
    if (currentWorkspaceIndex === null) return NONE;
    const workspace = workspaces[currentWorkspaceIndex];
    if (isTradingWorkspace(workspace)) {
      return workspace.personality;
    } else {
      return NONE;
    }
  }

  public get workspace(): Workspace | null {
    if (this.currentWorkspaceIndex === null) return null;
    const found: Workspace | undefined = this.workspaces[this.currentWorkspaceIndex];
    if (found) {
      return found;
    } else {
      return null;
    }
  }

  public static cleanupUrl(id: string): void {
    const { history, location } = window;
    const base = `${location.protocol}//${location.host}${location.pathname}`;
    // Replace the url with the same url but without parameters
    history.pushState({ userId: id }, '', base);
  }

  public addStandardWorkspace(group: users.CurrencyGroups): void {
    this.isCreatingWorkspace = true;
    // Do this after the `isCreatingWorkspace' takes effect
    setTimeout(() => this.internalAddWorkspace(group), 0);
  }

  public clearLastExecution(): void {
    this.recentExecutions = [];
  }

  public async closeWorkspace(index: number): Promise<void> {
    const workspaces = [...this.workspaces];
    // Update current workspace id
    if (workspaces.length === 0) {
      this.currentWorkspaceIndex = null;
    } else {
      this.currentWorkspaceIndex = 0;
    }
    this.workspaces = [...workspaces.slice(0, index), ...workspaces.slice(index + 1)];
  }

  public isUserAllowedToSignIn(user: users.User): boolean {
    const { workSchedule } = this;
    const { roles } = user;
    if (hasRole(roles, Role.Broker) || hasRole(roles, Role.Admin)) {
      return true;
    }
    const bod = parseAsNYTime(workSchedule.trading_start_time);
    const eod = parseAsNYTime(workSchedule.trading_end_time);

    return eod.isAfter(moment()) && bod.isBefore(moment());
  }

  public setUser(user: users.User): void {
    this.user = user;
  }

  public async initialize(id: string | null): Promise<void> {
    if (id === null) {
      this.status = WorkareaStatus.UserNotFound;
      return;
    }
    this.loadingStep = 100 / 9;
    this.setStatus(WorkareaStatus.Starting);
    try {
      const user: users.User | undefined = await this.loadUser(id);
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
        const regions: readonly string[] = await this.loadUserRegions(user.email);
        // Now the user object is complete
        this.setUser({ ...user, regions });
        this.persistStorage = new PersistStorage(this.user);
        // This is just for eye candy :)
        WorkareaStore.cleanupUrl(id);
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
        // Switch the normal view
        this.setStatus(WorkareaStatus.Ready);
      }
    } catch (error) {
      console.warn(error);
      this.setStatus(WorkareaStatus.Error);
    }
  }

  public setWorkspace(index: number): void {
    // FIXME: make this faster or smoother
    const { workspaces } = this;
    this.loadingStep = 1;
    this.workspaceAccessDenied = false;
    this.workspaceNotFound = false;
    const workspace: Workspace | undefined = workspaces[index];
    if (workspace === undefined) {
      this.workspaceNotFound = true;
    } else if (this.userHasAccessToWorkspace(workspace)) {
      this.currentWorkspaceIndex = index;
    } else {
      this.workspaceAccessDenied = true;
    }
  }

  public setWorkspaceName(index: number, name: string): void {
    const { workspaces } = this;
    const workspace: Workspace = workspaces[index];
    if (workspace === undefined) throw new Error('this must be impossible');
    workspace.setName(name);
    this.workspaces = [...workspaces];
  }

  public addRecentExecution(loadingMessage: message.Message): void {
    const { recentExecutions } = this;
    recentExecutions.push(loadingMessage);
  }

  public setPreferences(preferences: users.UserPreferences): void {
    this.preferences = preferences;
    this.loadTheme();
  }

  public addMiddleOffice(): void {
    this.isCreatingWorkspace = true;
    setTimeout(this.internalAddMiddleOffice, 0);
  }

  public closeAccessDeniedView(): void {
    this.workspaceAccessDenied = false;
  }

  public internalAddMiddleOffice(): void {
    const { workspaces } = this;
    // Create the workspace
    this.currentWorkspaceIndex = workspaces.length;
    this.workspaces = [...workspaces, new MiddleOfficeStore()];
    this.isCreatingWorkspace = false;
  }

  public internalAddWorkspace(group: users.CurrencyGroups): void {
    const { workspaces } = this;
    // Create the workspace
    this.currentWorkspaceIndex = workspaces.length;
    this.workspaces = [...workspaces, new TradingWorkspaceStore()];
    this.isCreatingWorkspace = false;
    // TODO: currently not being used but could be in the future
    //       again
    void group;
  }

  public loadTheme(): void {
    const { theme, fontFamily, fontSize } = this.preferences;
    updateApplicationTheme(theme, fontFamily, fontSize);
  }

  public mapSymbolsWithIds(): { [key: string]: FXSymbol } {
    const { symbols } = this;

    return symbols.reduce(
      (
        map: { [key: string]: FXSymbol },
        symbol: FXSymbol
      ): {
        [key: string]: FXSymbol;
      } => {
        map[symbol.symbolID] = symbol;
        return map;
      },
      {}
    );
  }

  public updateLoadingProgress(message: string): void {
    this.loadingMessage = message;
    this.loadingProgress = Math.min(this.loadingStep + this.loadingProgress, 100);
  }

  public async loadUser(id: string): Promise<users.User | undefined> {
    this.updateLoadingProgress(strings.StartingUp);

    const oktaUser: OktaUser = await API.getUser(id);
    this.users = await API.getAllUsers(oktaUser.email);
    const userInfo: users.UserInfo = await API.getUserInfo(oktaUser.email);
    const me = userInfo[0];
    // Find said user in the users array
    if (me === undefined) {
      return undefined;
    } else {
      const { roles } = oktaUser;

      return {
        email: oktaUser.email,
        firm: me.firm,
        firstname: me.firstname,
        lastname: me.lastname,
        regions: await API.getUserRegions(oktaUser.email),
        // Add broker role
        roles: roles,
      };
    }
  }

  public async loadUserRegions(email: string): Promise<readonly string[]> {
    this.updateLoadingProgress(strings.LoadingRegions);
    return API.getUserRegions(email);
  }

  public setCurrentWorkspaceIndex(index: number | null): void {
    this.currentWorkspaceIndex = index;
  }

  public setWorkspaces(workspaces: readonly Workspace[]) {
    this.workspaces = workspaces;
  }

  public async initializePersistStorage(): Promise<void> {
    const { persistStorage } = this;
    if (persistStorage === null || persistStorage === undefined) {
      throw new Error('persist storage not set');
    }
    this.updateLoadingProgress(strings.LoadingRegions);
    // Initialize the persistStorage object
    const savedStore = await persistStorage.read();

    this.setWorkspaces(savedStore.workspaces);
    this.setCurrentWorkspaceIndex(savedStore.currentWorkspaceIndex);
    this.setPreferences(savedStore.preferences);

    autorun((): void => {
      const { persistStorage } = this;
      if (persistStorage === null || persistStorage === undefined) {
        throw new Error('persist storage not set');
      }
      // Save the changes in the store (and all it's children)
      void persistStorage.persist(this.serialized);
    });
  }

  public async loadSystemSymbols(): Promise<void> {
    this.updateLoadingProgress(strings.LoadingSymbols);
    this.symbols = await API.getSymbols();
  }

  public async createSymbolsMap(): Promise<void> {
    this.symbolsMap = this.mapSymbolsWithIds();
  }

  public async loadSystemStrategies(): Promise<void> {
    this.updateLoadingProgress(strings.LoadingStrategies);
    this.products = await API.getProductsEx();
    this.strategies = this.products.filter(
      (product: Product): boolean => product.source === ProductSource.Electronic
    );
  }

  public async loadSystemTenors(): Promise<void> {
    this.updateLoadingProgress(strings.LoadingTenors);
    const tenors: string[] = await API.getTenors();

    this.tenors = tenors.sort((t1: string, t2: string) => tenorToNumber(t1) - tenorToNumber(t2));

    this.updateDefaultPodRows();
    this.updateDefaultOrders();
  }

  public async loadSystemBanks(): Promise<void> {
    this.updateLoadingProgress(strings.LoadingBanks);
    this.banks = await API.getBanks();
  }

  public onConnectedHandler(): void {
    this.status = WorkareaStatus.Ready;
    this.loadingMessage = strings.Connected;
    this.connected = true;
  }

  public onDisconnectedHandler(): void {
    this.connected = false;
  }

  public async connectToSignalR(): Promise<void> {
    this.updateLoadingProgress(strings.EstablishingConnection);
    if (signalRManager.connect()) {
      // Try to connect
      signalRManager.setOnConnectedListener(this.onConnectedHandler);
      signalRManager.setOnDisconnectedListener(this.onDisconnectedHandler);
    }
  }

  public setStatus(status: WorkareaStatus): void {
    this.loadingProgress = 0;
    this.status = status;
  }

  public userHasAccessToWorkspace(workspace: Workspace): boolean {
    const { roles } = this.user;
    switch (workspace.type) {
      case WorkspaceType.MiddleOffice:
        return (
          hasRole(roles, Role.MiddleOffice) ||
          hasRole(roles, Role.Broker) ||
          hasRole(roles, Role.Admin)
        );
      case WorkspaceType.Trading:
        return hasRole(roles, Role.Broker) || hasRole(roles, Role.Trader);
    }
    return false;
  }

  public async checkVersion(): Promise<void> {
    if (Date.now() - this.lastVersionCheckTimestamp < 5 * 60 * 1000) {
      return;
    }

    const response = await fetch('current-version');
    if (response.status !== 200) {
      throw new Error('cannot fetch the version number file');
    }

    this.lastVersionCheckTimestamp = Date.now();
    try {
      const latest = parseVersionNumber(await response.text());
      const active = parseVersionNumber(version);
      if (latest > active) {
        this.showNewVersionModal();
      }
    } catch (error) {
      console.warn(error);
    }
  }

  public showNewVersionModal(): void {
    this.isShowingNewVersionModal = true;
  }

  public upgradeApplication(): void {
    window.location.reload();
  }

  public createSessionTimer(): void {
    const { workSchedule } = this;
    const tradingEndTime = moment(workSchedule.trading_end_time, 'HH:mm:SS');
    setTimeout((): void => {
      this.setStatus(WorkareaStatus.NotAllowedAtThisTime);
    }, tradingEndTime.diff(moment(), 'ms'));
  }

  public updateDefaultOrders(): void {
    const { tenors } = this;

    this.defaultOrders = tenors.reduce(
      (
        depth: Record<string, readonly Order[]>,
        tenor: string
      ): Record<string, readonly Order[]> => {
        depth[tenor] = [];
        return depth;
      },
      {}
    );
  }

  public updateDefaultPodRows(): void {
    const { tenors } = this;

    this.defaultPodRows = tenors.reduce(
      (rows: Record<string, PodRow>, tenor: string): Record<string, PodRow> => {
        const row: PodRow = {
          id: tenor,
          tenor: tenor,
          bid: new Order(tenor, '', '', '', null, OrderTypes.Invalid),
          ofr: new Order(tenor, '', '', '', null, OrderTypes.Invalid),
          mid: null,
          spread: null,
          status: PodRowStatus.Normal,
          darkPrice: null,
        };

        return {
          ...rows,
          [tenor]: row,
        };
      },
      {}
    );
  }
}

export default new WorkareaStore();
