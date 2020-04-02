import React, { useEffect, ReactNode, useState } from 'react';
import { UserProfileModalTypes, User } from 'interfaces/user';
import { UserProfileForm } from 'components/Workspace/UserProfileForm/form';
import { ErrorBox } from 'components/ErrorBox';
import { MessageBox } from 'components/MessageBox';
import { UserProfileStore } from 'mobx/stores/userProfile';
import { observer } from 'mobx-react';

interface OwnProps {
  user: User;
  onCancel: () => void;
}

type Props = OwnProps;

const UserProfileModal: React.FC<Props> = observer((props: Props) => {
  const [store] = useState<UserProfileStore>(new UserProfileStore());
  const { user } = props;

  const onClose = () => {
    props.onCancel();
    // Reset the profile in case it has changed
    store.resetInitialProfile();
    store.setCurrentModal(UserProfileModalTypes.Form);
  };

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    store.saveUserProfile(user.email, store.profile);
  };

  useEffect(() => {
    store.loadUserProfile(user.email);
  }, [user.email, store]);

  const onChange = (name: string, value: any) => {

    store.setFieldValue(name, value);
  };

  const closeButton = (): ReactNode => (
    <button className={'cancel'} onClick={onClose}>Close</button>
  );

  switch (store.currentModalType) {
    case UserProfileModalTypes.Form:
      return <UserProfileForm profile={store.profile}
                              user={props.user}
                              original={store.initialProfile}
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
});

export { UserProfileModal };

