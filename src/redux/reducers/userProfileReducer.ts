import {
  UserProfileState,
  CurrencyGroups,
  UserTypes,
  UserProfileStatus,
  UserProfileModalTypes,
  UserProfile,
} from 'interfaces/user';
import {Action} from 'redux/action';

const defaultProfile: UserProfile = {
  ccyGroup: CurrencyGroups.Invalid,
  colorScheme: 'default',
  execSound: 'default',
  font: 'default',
  fontSize: '15px',
  mpid: '',
  oco: true,
  timezone: '',
  lastOCOUpdateTimestamp: null,
  userType: UserTypes.Unset,
};

export enum UserProfileAction {
  SetFieldValue = 'UserProfileAction.SetFieldValue',
  SetUserProfile = 'UserProfileAction.UpdateUserProfile',
  LoadUserProfile = 'UserProfileAction.LoadUserProfile',
  SetUserProfileLoadingError = 'UserProfileAction.SetUserProfileLoadingError',
  ResetInitialProfile = 'UserProfileAction.ResetInitialProfile',
  SetCurrentModal = 'UserProfileAction.SetCurrentModal',
  SavingUserProfile = 'UserProfileAction.SavingUserProfile',
}

const initialState: UserProfileState = {
  status: UserProfileStatus.Initial,
  currentModalType: UserProfileModalTypes.Form,
  profile: defaultProfile,
  initialProfile: defaultProfile,
};

export default (state: UserProfileState = initialState, {data, type}: Action<UserProfileAction>): UserProfileState => {
  switch (type) {
    case UserProfileAction.ResetInitialProfile:
      return {...state, profile: state.initialProfile};
    case UserProfileAction.SetCurrentModal:
      return {...state, currentModalType: data};
    case UserProfileAction.SetUserProfile:
      return {...state, profile: data, initialProfile: data, status: UserProfileStatus.Initial};
    case UserProfileAction.LoadUserProfile:
      return {...state, status: UserProfileStatus.Loading};
    case UserProfileAction.SetUserProfileLoadingError:
      return {...state, status: UserProfileStatus.Error};
    case UserProfileAction.SetFieldValue:
      return {...state, profile: {...state.profile, [data.name]: data.value}};
    default:
      return state;
  }
}

