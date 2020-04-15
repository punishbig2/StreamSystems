import { API } from 'API';
import { Globals } from 'golbals';
import { UserPreferences, UserProfileStatus, UserProfileModalTypes } from 'interfaces/user';
import { observable, action } from 'mobx';
import { defaultProfile } from 'redux/stateDefs/defaultUserProfile';

export class UserProfileStore {
  @observable status: UserProfileStatus = UserProfileStatus.Initial;
  @observable currentModalType: UserProfileModalTypes = UserProfileModalTypes.Form;
  @observable.ref profile: UserPreferences = defaultProfile;
  public initialProfile: UserPreferences = defaultProfile;

  constructor() {
    this.loadUserProfile('');
  }

  @action.bound
  public async loadUserProfile(email: string) {
    const profile: UserPreferences = await API.getUserProfile(email);
    // Update timezone
    Globals.timezone = profile.timezone;
    this.profile = profile;
    this.initialProfile = this.profile;
  }

  @action.bound
  public resetInitialProfile() {
    this.profile = this.initialProfile;
  }

  @action.bound
  public setCurrentModal(modalType: UserProfileModalTypes) {
    this.currentModalType = modalType;
  }

  @action.bound
  public setFieldValue(name: string, value: any) {
    this.profile = { ...this.profile, [name]: value };
  }

  @action.bound
  public async saveUserProfile(email: string, profile: any) {
    this.currentModalType = UserProfileModalTypes.Saving;
    localStorage.setItem('userProfile', JSON.stringify(profile));
    await new Promise((resolve: () => void) => setTimeout(resolve, 1800));
    this.currentModalType = UserProfileModalTypes.Success;
    this.profile = profile;
    this.initialProfile = profile;
  }
}

export default new UserProfileStore();
