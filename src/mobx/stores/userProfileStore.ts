import { API } from 'API';
import { Globals } from 'golbals';
import { UserPreferences, UserProfileStatus, UserProfileModalTypes } from 'interfaces/user';
import { observable, action } from 'mobx';
import { defaultProfile } from 'stateDefs/defaultUserProfile';

export class UserProfileStore {
  @observable status: UserProfileStatus = UserProfileStatus.Initial;
  @observable currentModalType: UserProfileModalTypes = UserProfileModalTypes.Form;
  @observable.ref preferences: UserPreferences = defaultProfile;
  public initialProfile: UserPreferences = defaultProfile;

  constructor() {
    this.loadUserProfile('');
  }

  @action.bound
  public async loadUserProfile(email: string) {
    const profile: UserPreferences = await API.getUserProfile(email);
    // Update timezone
    Globals.timezone = profile.timezone;
    this.preferences = profile;
    this.initialProfile = this.preferences;
  }

  @action.bound
  public resetInitialProfile() {
    this.preferences = this.initialProfile;
  }

  @action.bound
  public setCurrentModal(modalType: UserProfileModalTypes) {
    this.currentModalType = modalType;
  }

  @action.bound
  public setFieldValue(name: string, value: any) {
    this.preferences = { ...this.preferences, [name]: value };
  }

  @action.bound
  public async saveUserProfile(email: string, profile: any) {
    this.currentModalType = UserProfileModalTypes.Saving;
    localStorage.setItem('userProfile', JSON.stringify(profile));
    await new Promise((resolve: () => void) => setTimeout(resolve, 1800));
    this.currentModalType = UserProfileModalTypes.Success;
    this.preferences = profile;
    this.initialProfile = profile;
  }
}

export default new UserProfileStore();
