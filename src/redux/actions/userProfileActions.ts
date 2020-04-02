import { AsyncAction } from 'redux/asyncAction';
import { UserProfileActions } from 'redux/reducers/userProfileReducer';
import { createAction } from 'redux/actionCreator';
import { UserProfileModalTypes, UserWorkspace } from 'interfaces/user';
import { API } from 'API';
import { FXOAction } from 'redux/fxo-action';

export const loadUserProfile = (useremail: string): AsyncAction<FXOAction<UserProfileActions>> => {
  return new AsyncAction(async (): Promise<FXOAction<UserProfileActions>[]> => {

    // Initialize the original profile
    return [
      createAction<UserProfileActions>(UserProfileActions.SetUserProfile, null),
    ];
  }, createAction<UserProfileActions>(UserProfileActions.LoadUserProfile));
};

export const saveUserProfile = (useremail: string, profile: UserWorkspace): AsyncAction<FXOAction<UserProfileActions>> => {
  return new AsyncAction(async () => {
    try {
      const data: any = await API.saveUserProfile({ useremail, workspace: JSON.stringify(profile) });
      if (data === 'success') {
        return [
          createAction<UserProfileActions>(UserProfileActions.SetUserProfile, profile),
          createAction<UserProfileActions>(UserProfileActions.SetCurrentModal, UserProfileModalTypes.Success),
        ];
      } else {
        return [
          createAction<UserProfileActions>(UserProfileActions.SetUserProfileLoadingError, UserProfileModalTypes.Error),
          createAction<UserProfileActions>(UserProfileActions.SetCurrentModal, UserProfileModalTypes.Error),
        ];
      }
    } catch (error) {
      return [
        createAction<UserProfileActions>(UserProfileActions.SetUserProfileLoadingError, UserProfileModalTypes.Error),
        createAction<UserProfileActions>(UserProfileActions.SetCurrentModal, UserProfileModalTypes.Error),
      ];
    }
  }, createAction<UserProfileActions>(UserProfileActions.SavingUserProfile));
};

export const resetInitialProfile = (): FXOAction<UserProfileActions> =>
  createAction<UserProfileActions>(UserProfileActions.ResetInitialProfile);

export const setCurrentModal = (modalType: UserProfileModalTypes): FXOAction<UserProfileActions> =>
  createAction<UserProfileActions>(UserProfileActions.SetCurrentModal, modalType);

export const setFieldValue = (name: string, value: any): FXOAction<UserProfileActions> =>
  createAction<UserProfileActions>(UserProfileActions.SetFieldValue, { name, value });

