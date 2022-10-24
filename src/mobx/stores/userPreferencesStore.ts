import { action, observable } from "mobx";
import workareaStore from "mobx/stores/workareaStore";
import { defaultPreferences } from "stateDefs/defaultUserPreferences";
import * as user from "types/user";

export class UserPreferencesStore {
  @observable status: user.UserProfileStatus = user.UserProfileStatus.Initial;
  @observable currentModalType: user.UserProfileModalTypes =
    user.UserProfileModalTypes.Form;
  @observable.ref preferences: user.UserPreferences = defaultPreferences;
  public initialPreferences: user.UserPreferences = defaultPreferences;

  @action.bound
  public async loadUserProfile() {
    const { preferences } = workareaStore;
    // Make the "loading" effective
    this.preferences = preferences;
    this.initialPreferences = preferences;
  }

  @action.bound
  public resetInitialProfile() {
    this.preferences = this.initialPreferences;
  }

  @action.bound
  public setCurrentModal(modalType: user.UserProfileModalTypes) {
    this.currentModalType = modalType;
  }

  @action.bound
  public setFieldValue(name: string, value: any) {
    this.preferences = { ...this.preferences, [name]: value };
  }

  @action.bound
  public setCurrentModalType(modalType: user.UserProfileModalTypes) {
    this.currentModalType = modalType;
  }

  @action.bound
  public async saveUserProfile(preferences: user.UserPreferences) {
    this.setCurrentModalType(user.UserProfileModalTypes.Saving);
    // Update the database
    setTimeout(() => {
      workareaStore.setPreferences(preferences);
      // Reset the "initial" values
      this.initialPreferences = preferences;
      this.setCurrentModalType(user.UserProfileModalTypes.Form);
    }, 0);
  }
}

export default new UserPreferencesStore();
