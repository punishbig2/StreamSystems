import styled from 'styled-components';

export const Row = styled.div`
  &:not(:first-child) {
    border-top: 2px solid ${({theme}) => theme.tableBorderColor};
  }
`;
