import {FormControl, FormLabel, Select, MenuItem, Input, Checkbox, FormControlLabel} from '@material-ui/core';
import React, {useReducer, Reducer, FormEvent, useEffect, useCallback, ReactNode} from 'react';
import {getAuthenticatedUser} from 'utils/getCurrentUser';
import {User, UserTypes, UserProfile, CurrencyGroups} from 'interfaces/user';
import {Action} from 'redux/action';
import strings from 'locales';
import Grid from '@material-ui/core/Grid';
import {API} from 'API';
import {SelectEventData} from 'interfaces/selectEventData';
import {createAction} from 'redux/actionCreator';
import timezones, {TimezoneInfo} from 'data/timezones';

const renderTimezone = (value: unknown): ReactNode => {
  if (value === '')
    return <span className={'disabled-item'}>{strings.TimezoneUnset}</span>;
  return value as string;
};

const renderCCYGroup = (value: unknown): ReactNode => {
  if (value === '')
    return <span className={'disabled-item'}>{strings.CCYGroupUnset}</span>;
  return value as string;
};

interface OwnState {
}

enum ActionTypes {
  UpdateUserProfile,
  SetFieldValue
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

export const UserProfileForm: React.FC<Props> = (props: Props) => {
  const user: User = getAuthenticatedUser();
  const [state, dispatch] = useReducer<Reducer<State, Action<ActionTypes>>>(
    reducer,
    {
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

  const onSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      API.saveUserProfile({...state, useremail: user.email});
    },
    [state, user.email],
  );

  useEffect(() => {
    API.getUserProfile(user.email).then((profile: any) => {
      console.log(profile);
    });
  }, [user.email]);

  const onChange = ({target}: React.ChangeEvent<SelectEventData>) => {
    dispatch(
      createAction<ActionTypes>(ActionTypes.SetFieldValue, {
        name: target.name,
        value: target.value,
      }),
    );
  };

  return (
    <>
      <div className={'modal-title'}>{strings.UserProfile}</div>
      <form
        className={'user-profile-form'}
        name={'user-profile'}
        onSubmit={onSubmit}
        autoComplete={'off'}
        noValidate
      >
        <Grid container direction={'column'}>
          <Grid item container spacing={2} direction={'row'}>
            <Grid item xs={4}>
              <FormControl margin={'normal'} fullWidth>
                <FormLabel htmlFor={'user-type'}>User Type</FormLabel>
                <Select
                  id={'user-type'}
                  onChange={onChange}
                  name={'userType'}
                  value={state.userType}
                >
                  <MenuItem value={UserTypes.Bank}>Bank</MenuItem>
                  <MenuItem value={UserTypes.Broker}>Broker</MenuItem>
                  <MenuItem value={UserTypes.MarketMaker}>
                    Market Maker
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={4}>
              <FormControl margin={'normal'} fullWidth>
                <FormLabel htmlFor={'mpid'}>MPID</FormLabel>
                <Input
                  id={'mpid'}
                  onChange={onChange}
                  name={'mpid'}
                  value={state.mpid}
                />
              </FormControl>
            </Grid>
            <Grid item xs={4}>
              <FormControl margin={'normal'}>
                <FormLabel htmlFor={'oco'}>OCO</FormLabel>
                <FormControlLabel
                  control={
                    <Checkbox
                      id={'oco'}
                      value={state.oco}
                      name={'oco'}
                      onChange={onChange}
                    />
                  }
                  label={'Enabled'}
                ></FormControlLabel>
              </FormControl>
            </Grid>
          </Grid>

          <Grid item container spacing={2} direction={'row'}>
            <Grid item xs={6}>
              <FormControl margin={'normal'} fullWidth>
                <FormLabel htmlFor={'font'}>Font</FormLabel>
                <Select
                  id={'font'}
                  onChange={onChange}
                  name={'font'}
                  value={state.font}
                >
                  <MenuItem value={'default'}>Default</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={2}>
              <FormControl margin={'normal'} fullWidth>
                <FormLabel htmlFor={'font-size'}>Font Size</FormLabel>
                <Select
                  id={'font-size'}
                  onChange={onChange}
                  name={'fontSize'}
                  value={state.fontSize}
                >
                  <MenuItem value={'12px'}>12px</MenuItem>
                  <MenuItem value={'13px'}>13px</MenuItem>
                  <MenuItem value={'14px'}>14px</MenuItem>
                  <MenuItem value={'15px'}>15px</MenuItem>
                  <MenuItem value={'16px'}>16px</MenuItem>
                  <MenuItem value={'17px'}>17px</MenuItem>
                  <MenuItem value={'18px'}>18px</MenuItem>
                  <MenuItem value={'19px'}>19px</MenuItem>
                  <MenuItem value={'20px'}>20px</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={4}>
              <FormControl margin={'normal'} fullWidth>
                <FormLabel htmlFor={'exec-sound'}>Exec Sound</FormLabel>
                <Select
                  id={'exec-sound'}
                  onChange={onChange}
                  name={'execSound'}
                  value={state.execSound}
                >
                  <MenuItem value={'default'}>Default</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <Grid item>
            <FormControl margin={'normal'} fullWidth>
              <FormLabel htmlFor={'ccy-group'}>CCY Group</FormLabel>
              <Select
                id={'ccy-group'}
                onChange={onChange}
                name={'ccyGroup'}
                value={state.ccyGroup}
                displayEmpty={true}
                renderValue={renderCCYGroup}
              >
                <MenuItem value={CurrencyGroups.G10}>
                  {CurrencyGroups.G10}
                </MenuItem>
                <MenuItem value={CurrencyGroups.Asia}>
                  {CurrencyGroups.Asia}
                </MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item>
            <FormControl margin={'normal'} fullWidth>
              <FormLabel htmlFor={'time-zone'}>Time Zone</FormLabel>
              <Select
                id={'time-zone'}
                onChange={onChange}
                name={'timezone'}
                value={state.timezone}
                displayEmpty
                renderValue={renderTimezone}
              >
                {timezones.map((zone: TimezoneInfo) => (
                  <MenuItem key={zone.text} value={zone.text}>
                    {zone.text}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item>
            <FormControl fullWidth>
              <FormLabel>Workspace</FormLabel>
              <h4 className={'no-content'}>No content</h4>
            </FormControl>
          </Grid>

          <Grid item>
            <FormControl fullWidth margin={'normal'}>
              <FormLabel htmlFor={'color-scheme'}>Color Scheme</FormLabel>
              <Select
                id={'color-scheme'}
                onChange={onChange}
                name={'colorScheme'}
                value={state.colorScheme}
              >
                <MenuItem value={'default'}>Default</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
        <div className={'modal-buttons'}>
          <button className={'cancel'} onClick={props.onCancel} type={'button'}>
            {strings.Cancel}
          </button>
          <button className={'success'} type={'submit'}>
            {strings.Save}
          </button>
        </div>
      </form>
    </>
  );
};
