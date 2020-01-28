import React, {useReducer, Reducer, FormEvent, useEffect, useCallback, useState, ReactNode} from 'react';
import {getAuthenticatedUser} from 'utils/getCurrentUser';
import {User, UserTypes, UserProfile, CurrencyGroups} from 'interfaces/user';
import {Action} from 'redux/action';
import {API} from 'API';
import {createAction} from 'redux/actionCreator';
import {UserProfileForm} from 'components/Workspace/UserProfileForm/form';
import {ErrorBox} from 'components/ErrorBox';
import {MessageBox} from 'components/MessageBox';

interface OwnState {
}

enum ActionTypes {
  UpdateUserProfile,
  SetFieldValue,
}

interface Props {
  onCancel: () => void;
}

type State = OwnState & UserProfile;

const reducer: Reducer<State, Action<ActionTypes>> = (
  state: State,
  {data, type}: Action<ActionTypes>,
): State => {
  switch (type) {
    case ActionTypes.SetFieldValue:
      return {...state, [data.name]: data.value};
    case ActionTypes.UpdateUserProfile:
      return {...data};
    default:
      return state;
  }
};

enum ModalTypes {
  Form, Success, Error,
}

export const UserProfileModal: React.FC<Props> = (props: Props) => {
  const user: User = getAuthenticatedUser();
  const [originalProfile, setOriginalProfile] = useState<UserProfile | null>(null);
  const [currentModal, setCurrentModal] = useState<ModalTypes>(ModalTypes.Form);
  const [profile, dispatch] = useReducer<Reducer<State, Action<ActionTypes>>>(
    reducer, {
      userType: user.isbroker ? UserTypes.Broker : UserTypes.Bank,
      mpid: '',
      fontSize: '14px',
      font: 'default',
      execSound: 'default',
      timezone: '',
      colorScheme: 'default',
      ccyGroup: CurrencyGroups.Invalid,
      oco: true,
    },
  );

  const onClose = () => {
    props.onCancel();
    // Reset the profile in case it has changed
    dispatch(createAction<ActionTypes>(ActionTypes.UpdateUserProfile, originalProfile));
    setCurrentModal(ModalTypes.Form);
  };

  const onSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const object: any = JSON.stringify(profile);
      try {
        await API.saveUserProfile({
          username: user.email,
          workspace: object,
        });
        setCurrentModal(ModalTypes.Success);
        // Update the internal static version
        setOriginalProfile(profile);
      } catch {
        setCurrentModal(ModalTypes.Error);
      }
    },
    [profile, user.email],
  );

  const loadProfile = useCallback(() => {
    API.getUserProfile(user.email)
      .then((data: any) => {
        const profile: UserProfile = JSON.parse(data[0].workspace);
        dispatch(createAction<ActionTypes>(ActionTypes.UpdateUserProfile, profile));
        // Initialize the original profile
        setOriginalProfile(profile);
      });
  }, [user.email]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const onChange = ({target}: React.ChangeEvent<any>) => {
    const {name} = target;

    const value: any = (() => {
      if (target.type === 'checkbox') {
        return target.checked;
      } else {
        return target.value;
      }
    })();
    dispatch(
      createAction<ActionTypes>(ActionTypes.SetFieldValue, {
        name: name,
        value: value,
      }),
    );
  };

  const closeButton = (): ReactNode => (
    <button className={'cancel'} onClick={onClose}>Close</button>
  );

  switch (currentModal) {
    case ModalTypes.Form:
      return <UserProfileForm profile={profile}
                              original={originalProfile}
                              onChange={onChange}
                              onSubmit={onSubmit}
                              onCancel={onClose}/>;
    case ModalTypes.Success:
      return (
        <MessageBox title={'Looks Good'}
                    message={'Looks like your settings were saved successfully, great!'}
                    icon={'check-circle'}
                    color={'good'}
                    buttons={closeButton}/>
      );
    case ModalTypes.Error:
      return (
        <ErrorBox message={'Something went wrong, we are sorry. This is quite unexpected.'}
                  onClose={onClose}
                  title={'Oops, an error happened'}/>
      );
    default:
      return null;
  }
};
