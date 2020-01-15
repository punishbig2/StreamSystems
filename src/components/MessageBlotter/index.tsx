import messageBlotterColumns from 'columns/messageBlotter';
import {Row} from 'components/MessageBlotter/row';
import {Table} from 'components/Table';
import {ColumnSpec} from 'components/Table/columnSpecification';
import {User} from 'interfaces/user';
import strings from 'locales';
import React, {useEffect} from 'react';
import {connect} from 'react-redux';
import {ApplicationState} from 'redux/applicationState';
import {MessageBlotterState} from 'redux/stateDefs/messageBlotterState';
import {getAuthenticatedUser} from 'utils/getCurrentUser';

interface DispatchProps {
}

interface OwnProps {
  // FIXME: add filters and sorting
  setWindowTitle: (id: string, title: string) => void;
  id: string;
  personality: string;
  connected: boolean;
}

const mapStateToProps: ({messageBlotter}: ApplicationState) => MessageBlotterState =
  ({messageBlotter}: ApplicationState): MessageBlotterState => messageBlotter;

const mapDispatchToProps: DispatchProps = {
  }
;

const withRedux = connect<MessageBlotterState, DispatchProps, OwnProps, ApplicationState>(
  mapStateToProps,
  mapDispatchToProps,
);

type Props = OwnProps & DispatchProps & MessageBlotterState;
const MessageBlotter: React.FC<OwnProps> = withRedux((props: Props) => {
  const {entries, setWindowTitle, id} = props;
  useEffect(() => {
    setWindowTitle(id, strings.Monitor);
  }, [id, setWindowTitle]);
  const renderRow = (props: any) => (
    <Row key={props.key}
         columns={props.columns}
         row={props.row}
         weight={props.weight}/>
  );
  const user: User = getAuthenticatedUser();
  const columns: ColumnSpec[] = user.isbroker ? messageBlotterColumns.broker : messageBlotterColumns.normal;
  return (
    <>
      <div className={'window-title-bar'}>
        <h1>{strings.Messages}</h1>
      </div>
      <div className={'window-content'}>
        <Table scrollable={true} columns={columns} rows={entries} renderRow={renderRow}/>
      </div>
    </>
  );
});
export {MessageBlotter};
