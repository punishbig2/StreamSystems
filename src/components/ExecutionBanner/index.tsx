import React, {ReactElement} from 'react';
import {MapStateToProps, connect} from 'react-redux';
import {ApplicationState} from 'redux/applicationState';
import {Message} from 'interfaces/message';

interface OwnProps {
}

interface State {
  executions: any[];
}

const mapStateToProps: MapStateToProps<State, OwnProps, ApplicationState> =
  ({executions}: ApplicationState) => ({executions});

const withRedux = connect(mapStateToProps);

const ExecutionBanner: React.FC<OwnProps & State> = (props: OwnProps & State): ReactElement | null => {
  const {executions} = props;
  return (
    <div className={'execution-banner'}>
      {executions.map((execution: Message) => (
        <div className={'execution-banner-item'} key={execution.ExecID}>
          {execution.Symbol}, {execution.Strategy}, {execution.Tenor}, {execution.LastPx}
        </div>
      ))}
    </div>
  );
};

const connected = withRedux(ExecutionBanner);
export {connected as ExecutionBanner};

