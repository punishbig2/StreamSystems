import { action, makeObservable, observable } from 'mobx';
import workareaStore from 'mobx/stores/workareaStore';
import { defaultPreferences } from 'stateDefs/defaultUserPreferences';
import * as user from 'types/user';

export class UserPreferencesStore {
  public status: user.UserProfileStatus = user.UserProfileStatus.Initial;
  public currentModalType: user.UserProfileModalTypes = user.UserProfileModalTypes.Form;
  public preferences: user.UserPreferences = defaultPreferences;
  public initialPreferences: user.UserPreferences = defaultPreferences;

  constructor() {
    makeObservable(this, {
      status: observable,
      currentModalType: observable,
      preferences: observable.ref,
      loadUserProfile: action.bound,
      resetInitialProfile: action.bound,
      setCurrentModal: action.bound,
      setFieldValue: action.bound,
      setCurrentModalType: action.bound,
      saveUserProfile: action.bound,
    });
  }

  public async loadUserProfile(): Promise<void> {
    const { preferences } = workareaStore;
    // Make the "loading" effective
    this.preferences = preferences;
    this.initialPreferences = preferences;
  }

  public resetInitialProfile(): void {
    this.preferences = this.initialPreferences;
  }

  public setCurrentModal(modalType: user.UserProfileModalTypes): void {
    this.currentModalType = modalType;
  }

  public setFieldValue(name: string, value: any): void {
    this.preferences = { ...this.preferences, [name]: value };
  }

  public setCurrentModalType(modalType: user.UserProfileModalTypes): void {
    this.currentModalType = modalType;
  }

  public async saveUserProfile(preferences: user.UserPreferences): Promise<void> {
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
