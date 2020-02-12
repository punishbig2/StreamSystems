import React, {ReactElement} from 'react';
import {MapStateToProps, connect} from 'react-redux';
import {ApplicationState} from 'redux/applicationState';
import {Message} from 'interfaces/message';
import {priceFormatter} from 'utils/priceFormatter';

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
  const start: number = Math.max(0, executions.length - 5);
  const end: number = start + 5;
  const last5: Message[] = executions
    .slice(start, end)
    .reverse();
  return (
    <div className={'execution-banner'}>
      {last5.map((execution: Message) => (
        <div className={'execution-banner-item'} key={execution.ExecID}>
          {execution.Symbol} {execution.Strategy} {execution.Tenor}@{priceFormatter(Number(execution.LastPx))}
        </div>
      ))}
    </div>
  );
};

const connected = withRedux(ExecutionBanner);
export {connected as ExecutionBanner};

