import {Button} from '@blueprintjs/core';

import '@blueprintjs/core/lib/css/blueprint.css';
import {DialogButtons} from 'components/PullRight';
import React, {ReactElement} from 'react';
import styled from 'styled-components';

interface QuestionProps {
  title: string;
  content: string;
  onNo: () => void;
  onYes: () => void;
}

const Container = styled.div`
  width: 400px;
`;
const Title = styled.h4`
  margin: 0;
`;
const Paragraph = styled.p`
  margin: 8px 0;
  min-height: 5em;
  opacity: 0.75;
`;

export const Question: React.FC<QuestionProps> = (props: QuestionProps): ReactElement => {
  return (
    <Container>
      <Title>{props.title}</Title>
      <Paragraph>{props.content}</Paragraph>
      <DialogButtons>
        <Button intent={'success'} text={'Yes'} onClick={props.onYes}/>
        <Button intent={'none'} text={'No'} onClick={props.onNo}/>
      </DialogButtons>
    </Container>
  );
};
