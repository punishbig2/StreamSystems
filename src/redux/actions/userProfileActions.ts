import {AsyncAction} from 'redux/asyncAction';
import {UserProfileAction} from 'redux/reducers/userProfileReducer';
import {Action} from 'redux/action';
import {createAction} from 'redux/actionCreator';
import {UserProfileModalTypes, UserProfile} from 'interfaces/user';
import {API} from 'API';

export const loadUserProfile = (useremail: string): AsyncAction<Action<UserProfileAction>> => {
  return new AsyncAction(async (): Promise<Action<UserProfileAction>[]> => {
    const data: any = await API.getUserProfile(useremail);
    if (data[0] === undefined)
      return [];
    // Extract the actual user profile
    const profile: UserProfile = JSON.parse(data[0].workspace);
    // Initialize the original profile
    return [
      createAction<UserProfileAction>(UserProfileAction.SetUserProfile, profile),
    ];
  }, createAction<UserProfileAction>(UserProfileAction.LoadUserProfile));
};

export const saveUserProfile = (useremail: string, profile: UserProfile, lastOCO: boolean): AsyncAction<Action<UserProfileAction>> => {
  return new AsyncAction(async (): Promise<Action<UserProfileAction>[]> => {
    try {
      if (lastOCO !== profile.oco)
        profile.lastOCOUpdateTimestamp = Date.now();
      const data: any = await API.saveUserProfile({useremail, workspace: JSON.stringify(profile)});
      if (data === 'success') {
        // Initialize the original profile
        return [
          createAction<UserProfileAction>(UserProfileAction.SetUserProfile, profile),
          createAction<UserProfileAction>(UserProfileAction.SetCurrentModal, UserProfileModalTypes.Success),
        ];
      } else {
        return [
          createAction<UserProfileAction>(UserProfileAction.SetUserProfileLoadingError, UserProfileModalTypes.Error),
          createAction<UserProfileAction>(UserProfileAction.SetCurrentModal, UserProfileModalTypes.Error),
        ];
      }
    } catch (error) {
      return [
        createAction<UserProfileAction>(UserProfileAction.SetUserProfileLoadingError, UserProfileModalTypes.Error),
        createAction<UserProfileAction>(UserProfileAction.SetCurrentModal, UserProfileModalTypes.Error),
      ];
    }
  }, createAction<UserProfileAction>(UserProfileAction.SavingUserProfile));
};

export const resetInitialProfile = (): Action<UserProfileAction> =>
  createAction<UserProfileAction>(UserProfileAction.ResetInitialProfile);

export const setCurrentModal = (modalType: UserProfileModalTypes): Action<UserProfileAction> =>
  createAction<UserProfileAction>(UserProfileAction.SetCurrentModal, modalType);

export const setFieldValue = (name: string, value: any): Action<UserProfileAction> =>
  createAction<UserProfileAction>(UserProfileAction.SetFieldValue, {name, value});
