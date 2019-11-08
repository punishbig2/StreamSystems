export enum WindowTypes {
  TOB = 1,
  MessageBlotter = 2,
  Empty = 3,
}

export enum WorkareaActions {
  Initialized = 'Initialized',
  Initializing = 'Initializing',
  SetWorkspace = 'SetWorkspace',
  AddWorkspace = 'AddWorkspace',
  AddTile = 'AddTile',
  CloseWorkspace = 'CloseWorkspace',
  RenameWorkspace = 'RenameWorkspace',
  SetupTOBTile = 'SetupTOBTile',
  CreatingOrder = 'CreatingOrder',
  OrderCreated = 'OrderCreated',
  OrderCreationFailed = 'OrderCreationFailed',
}
