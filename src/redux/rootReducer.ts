import workareaReducer from 'redux/reducers/workareaReducer';
import messageBlotterReducer from 'redux/reducers/messageBlotterReducer';
import userProfileReducer from 'redux/reducers/userProfileReducer';
import executionsReducer from 'redux/reducers/executionsReducer';
import autoMergeLevel2 from 'redux-persist/es/stateReconciler/autoMergeLevel2';
import {persistCombineReducers} from 'redux-persist';
import {storage} from 'reduxPersistStorage';
import {WorkareaTransform} from 'reduxPersistTransform';

export default persistCombineReducers({
    key: 'root',
    storage: storage,
    stateReconciler: autoMergeLevel2,
    transforms: [WorkareaTransform],
  }, {
    workarea: workareaReducer,
    messageBlotter: messageBlotterReducer,
    userProfile: userProfileReducer,
    executions: executionsReducer,
  },
);

