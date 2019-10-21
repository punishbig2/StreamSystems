import styled from 'styled-components';

export const MiniDOBRow = styled.div`
  display: flex;
  align-items: center;
  &:first-child {
    border-top: 1px solid ${({theme}) => theme.tableBorderColor};
  }
  border-bottom: 1px solid ${({theme}) => theme.tableBorderColor};
`;
