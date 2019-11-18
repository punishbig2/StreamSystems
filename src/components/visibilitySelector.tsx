import styled from 'styled-components';

export const VisibilitySelector = styled.div`
  display: ${({visible}: { visible: boolean }) => visible ? 'block' : 'none'};
`;
