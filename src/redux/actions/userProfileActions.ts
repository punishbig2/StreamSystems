import {AsyncAction} from 'redux/asyncAction';
import {UserProfileActions, defaultProfile} from 'redux/reducers/userProfileReducer';
import {createAction} from 'redux/actionCreator';
import {UserProfileModalTypes, UserWorkspace} from 'interfaces/user';
import {API} from 'API';
import {FXOAction} from 'redux/fxo-action';
import {Globals} from 'golbals';

export const loadUserProfile = (useremail: string): AsyncAction<FXOAction<UserProfileActions>> => {
  return new AsyncAction(async (): Promise<FXOAction<UserProfileActions>[]> => {
    const data: any = await API.getUserProfile(useremail);
    if (data[0] === undefined)
      return [];
    // Extract the actual user profile
    const profile: UserWorkspace = {...defaultProfile, ...JSON.parse(data[0].workspace)};
    // Update timezone
    Globals.timezone = profile.timezone;
    // Initialize the original profile
    return [
      createAction<UserProfileActions>(UserProfileActions.SetUserProfile, profile),
    ];
  }, createAction<UserProfileActions>(UserProfileActions.LoadUserProfile));
};

export const saveUserProfile = (useremail: string, profile: UserWorkspace): AsyncAction<FXOAction<UserProfileActions>> => {
  return new AsyncAction(async () => {
    try {
      const data: any = await API.saveUserProfile({useremail, workspace: JSON.stringify(profile)});
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
  createAction<UserProfileActions>(UserProfileActions.SetFieldValue, {name, value});

