import {User} from 'interfaces/user';
import {store} from 'redux/store';

export const getAuthenticatedUser = (): User => {
  const {auth: {user}} = store.getState();
  return user;
};

