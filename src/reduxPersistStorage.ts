import config from 'config';
import {getUserFromUrl} from 'utils/getUserFromUrl';
import {UserWorkspace} from 'interfaces/user';
import {defaultProfile} from 'redux/reducers/userProfileReducer';

const {Api} = config;
const saveToBackend = async (useremail: string, workspace: any) => {
  return null;
  /*return new Promise((resolve: () => void, reject: () => void) => {
    const xhr: XMLHttpRequest = new XMLHttpRequest();
    const url: string = `${Api.Protocol}://${Api.Host}/api/UserApi/saveUserJson?useremail=${useremail}&workspace=${workspace}`;
    xhr.open('POST', url, false);
    xhr.onreadystatechange = () => {
      if (xhr.status === 200) {
        resolve();
      } else {
        reject();
      }
    };
    xhr.send();
    const profile: any[] = await API.getUserProfile(email);
    if (profile.length === 0)
      return defaultProfile;
    console.log('returning the result');
    return JSON.parse(profile[0].workspace);
    resolve();
  });*/
};

const readFromBackend = async (email: string): Promise<UserWorkspace> => {
  return new Promise((resolve: (workspace: UserWorkspace) => void, reject: () => void) => {
    const xhr: XMLHttpRequest = new XMLHttpRequest();
    const url: string = `${Api.Protocol}://${Api.Host}/api/UserApi/getUserJson?useremail=${email}`;
    xhr.open('GET', url, false);
    xhr.onreadystatechange = () => {
      if (xhr.status === 200) {
        const object: { workspace: any }[] = JSON.parse(xhr.responseText);
        if (!object[0]) {
          resolve(defaultProfile);
        } else {
          resolve(JSON.parse(object[0].workspace));
        }
      } else {
        reject();
      }
    };
    xhr.send();
    /*const profile: any[] = await API.getUserProfile(email);
    if (profile.length === 0)
      return defaultProfile;
    console.log('returning the result');
    return JSON.parse(profile[0].workspace);*/
    resolve(defaultProfile);
  });
};

let readTimer = setTimeout(() => null, 0);

export const storage = {
  getItem: async (key: string): Promise<string | null> => {
    const useremail: string | null = getUserFromUrl();
    if (useremail === null)
      return null;
    const localItem: any = localStorage.getItem(key);
    if (localItem !== null)
      return localItem;
    // Read from the backend
    const profile: UserWorkspace = await readFromBackend(useremail);
    // Return read item ...
    return profile[key];
  },
  setItem: async (key: string, value: string): Promise<void> => {
    const useremail: string | null = getUserFromUrl();
    if (useremail === null)
      return;
    clearTimeout(readTimer);
    readTimer = setTimeout(() => {
      readFromBackend(useremail)
        .then((currentWorkspace: UserWorkspace) => {
          const workspace = {
            ...currentWorkspace,
            [key]: value,
          };
          return saveToBackend(useremail, JSON.stringify(workspace));
        })
        .then(() => {
        });
    }, 100);
    localStorage.setItem(key, value);
  },
  removeItem: async (key: string): Promise<void> => {
    const useremail: string | null = getUserFromUrl();
    if (useremail === null)
      return;
    readTimer = setTimeout(() => {
      readFromBackend(useremail)
        .then((originalWorkspace: UserWorkspace) => {
          const workspace: UserWorkspace = {...originalWorkspace};
          // Remove said key
          delete workspace[key];
          saveToBackend(useremail, JSON.stringify(workspace));
        });
      localStorage.removeItem(key);
    }, 100);
  },
};

