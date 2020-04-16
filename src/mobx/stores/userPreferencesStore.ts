import { UserPreferences, UserProfileStatus, UserProfileModalTypes } from 'interfaces/user';
import { observable, action } from 'mobx';
import { defaultPreferences } from 'stateDefs/defaultUserPreferences';
import workareaStore from 'mobx/stores/workareaStore';
import { Globals } from 'golbals';

export class UserPreferencesStore {
  @observable status: UserProfileStatus = UserProfileStatus.Initial;
  @observable currentModalType: UserProfileModalTypes = UserProfileModalTypes.Form;
  @observable.ref preferences: UserPreferences = defaultPreferences;
  public initialPreferences: UserPreferences = defaultPreferences;

  @action.bound
  public async loadUserProfile() {
    const { preferences } = workareaStore;
    // Make this available everywhere
    Globals.timezone = preferences.timezone;
    // Make the "loading" effective
    this.preferences = preferences;
    this.initialPreferences = preferences;
  }

  @action.bound
  public resetInitialProfile() {
    this.preferences = this.initialPreferences;
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
  public setCurrentModalType(modalType: UserProfileModalTypes) {
    this.currentModalType = modalType;
  }

  @action.bound
  public async saveUserProfile(preferences: UserPreferences) {
    this.setCurrentModalType(UserProfileModalTypes.Saving);
    // Update the database
    setTimeout(() => {
      workareaStore.setPreferences(preferences);
      // Reset the "initial" values
      this.initialPreferences = preferences;
      this.setCurrentModalType(UserProfileModalTypes.Success);
    }, 0);
  }
}

export default new UserPreferencesStore();