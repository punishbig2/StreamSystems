import {
  UserPreferences,
  UserProfileStatus,
  UserProfileModalTypes,
} from "types/user";
import { observable, action } from "mobx";
import { defaultPreferences } from "stateDefs/defaultUserPreferences";
import workareaStore from "mobx/stores/workareaStore";
import { Globals } from "golbals";
import { updateApplicationTheme } from "utils";

export class UserPreferencesStore {
  @observable status: UserProfileStatus = UserProfileStatus.Initial;
  @observable currentModalType: UserProfileModalTypes =
    UserProfileModalTypes.Form;
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
    const { theme, colorScheme, font } = this.preferences;
    // Update the theme too
    updateApplicationTheme(theme, colorScheme, font);
  }

  @action.bound
  public setCurrentModal(modalType: UserProfileModalTypes) {
    this.currentModalType = modalType;
  }

  @action.bound
  public setFieldValue(name: string, value: any) {
    this.preferences = { ...this.preferences, [name]: value };
    if (name === "theme" || name === "colorScheme" || name === "font") {
      const { theme, colorScheme, font } = this.preferences;
      updateApplicationTheme(theme, colorScheme, font);
    }
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
      this.setCurrentModalType(UserProfileModalTypes.Form);
    }, 0);
  }
}

export default new UserPreferencesStore();
