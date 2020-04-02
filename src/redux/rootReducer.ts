// import workareaReducer from 'redux/reducers/workareaReducer';
import messageBlotterReducer from 'redux/reducers/messageBlotterReducer';
import userProfileReducer from 'redux/reducers/userProfileReducer';
import executionsReducer from 'redux/reducers/executionsReducer';
import { combineReducers } from 'redux';

export default combineReducers({
  // workarea: workareaReducer,
  messageBlotter: messageBlotterReducer,
  userProfile: userProfileReducer,
  executions: executionsReducer,
});

