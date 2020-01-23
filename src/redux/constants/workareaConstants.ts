export enum WindowTypes {
  TOB = 1,
  MessageBlotter = 2,
  Empty = 3
}

export enum WorkareaActions {
  Initialized = 'WorkareaActions.Initialized',
  Initializing = 'WorkareaActions.Initializing',
  SetWorkspace = 'WorkareaActions.SetWorkspace',
  AddWorkspace = 'WorkareaActions.AddWorkspace',
  AddTile = 'WorkareaActions.AddTile',
  CloseWorkspace = 'WorkareaActions.CloseWorkspace',
  RenameWorkspace = 'WorkareaActions.RenameWorkspace',
  SetupTOBTile = 'WorkareaActions.SetupTOBTile',
  NoAction = 'WorkareaActions.NoAction',
  LoadingSymbols = 'WorkareaActions.LoadingSymbols',
  LoadingStrategies = 'WorkareaActions.LoadingStrategies',
  LoadingTenors = 'WorkareaActions.LoadingTenors',
  LoadingMessages = 'WorkareaActions.LoadingMessages',
  LoadingUsersList = 'WorkareaActions.LoadingUsersList',
  ServerUnavailable = 'WorkareaActions.ServerUnavailable',
  SetLastExecution = 'WorkareaActions.SetLastExecution',
  ClearLastExecution = 'WorkareaActions.ClearLastExecution'
}
