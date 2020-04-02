import { UserProfileStatus, UserProfileModalTypes, UserWorkspace } from 'interfaces/user';
import { observable, action } from 'mobx';
import { defaultProfile } from 'redux/reducers/userProfileReducer';
import { API } from 'API';
import { Globals } from 'golbals';

export class UserProfileStore {
  @observable status: UserProfileStatus = UserProfileStatus.Initial;
  @observable currentModalType: UserProfileModalTypes = UserProfileModalTypes.Form;
  @observable.ref profile: UserWorkspace = defaultProfile;
  public initialProfile: UserWorkspace = defaultProfile;

  @action.bound
  public async loadUserProfile(email: string) {
    const data: any = await API.getUserProfile(email);
    if (data[0] === undefined)
      return [];
    // Extract the actual user profile
    const profile: UserWorkspace = { ...defaultProfile, ...JSON.parse(data[0].workspace) };
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
  public saveUserProfile(email: string, profile: any) {
  }
}
