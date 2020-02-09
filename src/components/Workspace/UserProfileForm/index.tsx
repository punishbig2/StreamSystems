import React, {useEffect, ReactNode} from 'react';
import {UserProfileState, UserProfileModalTypes, User} from 'interfaces/user';
import {UserProfileForm} from 'components/Workspace/UserProfileForm/form';
import {ErrorBox} from 'components/ErrorBox';
import {MessageBox} from 'components/MessageBox';
import {MapStateToProps, MapDispatchToProps, connect} from 'react-redux';
import {ApplicationState} from 'redux/applicationState';
import {
  loadUserProfile,
  resetInitialProfile,
  setCurrentModal,
  setFieldValue,
  saveUserProfile,
} from 'redux/actions/userProfileActions';
import {UserProfileActions} from 'redux/reducers/userProfileReducer';
import {AsyncAction} from 'redux/asyncAction';
import {getAuthenticatedUser} from 'utils/getCurrentUser';
import {FXOAction} from 'redux/fxo-action';

interface DispatchProps {
  loadUserProfile: (useremail: string) => AsyncAction<UserProfileActions>,
  resetInitialProfile: () => FXOAction<UserProfileActions>;
  setCurrentModal: (modalType: UserProfileModalTypes) => FXOAction<UserProfileActions>;
  setFieldValue: (name: string, value: any) => FXOAction<UserProfileActions>;
  saveUserProfile: (useremail: string, profile: any, lastOCO: boolean) => AsyncAction<UserProfileActions>,
}

interface OwnProps {
  onCancel: () => void;
}

const mapStateToProps: MapStateToProps<UserProfileState, OwnProps, ApplicationState> =
  ({userProfile}: ApplicationState) => userProfile;
const mapDispatchToProps: MapDispatchToProps<DispatchProps, OwnProps> = ({
  loadUserProfile,
  resetInitialProfile,
  setCurrentModal,
  setFieldValue,
  saveUserProfile,
});

const withRedux = connect(mapStateToProps, mapDispatchToProps);

type Props = OwnProps & DispatchProps & UserProfileState;

const UserProfileModal: React.FC<Props> = (props: Props) => {
  const {loadUserProfile} = props;
  const user: User = getAuthenticatedUser();

  const onClose = () => {
    props.onCancel();
    // Reset the profile in case it has changed
    props.resetInitialProfile();
    props.setCurrentModal(UserProfileModalTypes.Form);
  };

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    const {initialProfile} = props;
    event.preventDefault();
    props.saveUserProfile(user.email, props.profile, initialProfile.oco);
  };

  useEffect(() => {
    loadUserProfile(user.email);
  }, [user.email, loadUserProfile]);

  const onChange = ({target}: React.ChangeEvent<any>) => {
    const {name} = target;

    const value: any = (() => {
      if (target.type === 'checkbox') {
        return target.checked;
      } else {
        return target.value;
      }
    })();
    props.setFieldValue(name, value);
  };

  const closeButton = (): ReactNode => (
    <button className={'cancel'} onClick={onClose}>Close</button>
  );

  switch (props.currentModalType) {
    case UserProfileModalTypes.Form:
      return <UserProfileForm profile={props.profile}
                              original={props.initialProfile}
                              onChange={onChange}
                              onSubmit={onSubmit}
                              onCancel={onClose}/>;
    case UserProfileModalTypes.Success:
      return (
        <MessageBox title={'Looks Good'}
                    message={'Looks like your settings were saved successfully, great!'}
                    icon={'check-circle'}
                    color={'good'}
                    buttons={closeButton}/>
      );
    case UserProfileModalTypes.Error:
      return (
        <ErrorBox message={'Something went wrong, we are sorry. This is quite unexpected.'}
                  onClose={onClose}
                  title={'Oops, an error happened'}/>
      );
    default:
      return null;
  }
};

const connected = withRedux(UserProfileModal);
export {connected as UserProfileModal};
