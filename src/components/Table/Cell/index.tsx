import {User} from 'interfaces/user';
import React from 'react';
import styled from 'styled-components';

interface CellProps {
  render: React.FC<any>,
  width: number;
  handlers: any;
  user: User;
  data: any;
}

const CellLayout = styled.div`
  width: ${(props: { width: number }) => props.width}%;
  padding: 0;
  margin: 0;
  border-bottom: 1px solid ${({theme}) => theme.tableBorderColor};
  &:not(:last-child) {
    border-right: 1px solid ${({theme}) => theme.tableBorderColor};
  }
  display: inline-block;
  vertical-align: middle;
  box-sizing: border-box;
  line-height: ${({theme}) => theme.tableRowSize}px;
  height: ${({theme}) => theme.tableRowSize}px;
  font-size: ${({theme}) => theme.tableFontSize}px;
  font-family: ${({theme}) => theme.tableFontFamily};
  font-weight: ${({theme}) => theme.tableFontWeight};
`;

export const Cell: React.FC<CellProps> = (props: CellProps) => {
  const {render, width, handlers, user, ...data} = props;
  return (
    <CellLayout width={width}>
      {render({...data, user, handlers})}
    </CellLayout>
  );
};
