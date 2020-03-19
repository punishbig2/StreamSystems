import {
  UserProfileState,
  CurrencyGroups,
  UserTypes,
  UserProfileStatus,
  UserProfileModalTypes,
  UserWorkspace,
  OCOModes,
} from 'interfaces/user';
import {FXOAction} from 'redux/fxo-action';

export const defaultProfile: UserWorkspace = {
  ccyGroup: CurrencyGroups.Invalid,
  colorScheme: 'default',
  execSound: 'default',
  font: 'default',
  fontSize: '15px',
  mpid: '',
  oco: OCOModes.Disabled,
  timezone: '',
  lastOCOUpdateTimestamp: null,
  userType: UserTypes.Unset,
  execSoundList: [],
};

export enum UserProfileActions {
  SetFieldValue = 'UserProfileAction.SetFieldValue',
  SetUserProfile = 'UserProfileAction.UpdateUserProfile',
  LoadUserProfile = 'UserProfileAction.LoadUserProfile',
  SetUserProfileLoadingError = 'UserProfileAction.SetUserProfileLoadingError',
  ResetInitialProfile = 'UserProfileAction.ResetInitialProfile',
  SetCurrentModal = 'UserProfileAction.SetCurrentModal',
  SavingUserProfile = 'UserProfileAction.SavingUserProfile',
}

export const defaultUserProfileState: UserProfileState = {
  status: UserProfileStatus.Initial,
  currentModalType: UserProfileModalTypes.Form,
  profile: defaultProfile,
  initialProfile: defaultProfile,
};

export default (state: UserProfileState = defaultUserProfileState, {data, type}: FXOAction<UserProfileActions>): UserProfileState => {
  switch (type) {
    case UserProfileActions.ResetInitialProfile:
      return {...state, profile: state.initialProfile};
    case UserProfileActions.SetCurrentModal:
      return {...state, currentModalType: data};
    case UserProfileActions.SetUserProfile:
      return {...state, profile: data, initialProfile: data, status: UserProfileStatus.Initial};
    case UserProfileActions.LoadUserProfile:
      return {...state, status: UserProfileStatus.Loading};
    case UserProfileActions.SetUserProfileLoadingError:
      return {...state, status: UserProfileStatus.Error};
    case UserProfileActions.SetFieldValue:
      return {...state, profile: {...state.profile, [data.name]: data.value}};
    default:
      return state;
  }
}

