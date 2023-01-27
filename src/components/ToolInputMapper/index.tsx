import { ChangeEventHandler } from 'react'
import LineToolInputs from '../ToolInputs/LineToolInputs/index'

const ToolInputs = ({ 
  toolName, 
  inputValues, 
  setInputValue
}: {
  toolName: string;
  inputValues: { [key: string]: string };
  setInputValue: ChangeEventHandler;
}) => {
  return (
    <div>
      { toolName === 'line' ? (
        <LineToolInputs inputValues={inputValues} setInputValue={setInputValue} /> 
      ) : null}
    </div>
  )
}

export default ToolInputs