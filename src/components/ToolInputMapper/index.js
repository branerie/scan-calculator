import React from 'react'
import LineToolInputs from '../ToolInputs/LineToolInputs'

const ToolInputs = ({ toolName, inputValues, setInputValue }) => {
    return (
        
        <div>
            { toolName === 'line' && 
                <LineToolInputs inputValues={inputValues} setInputValue={setInputValue} /> 
            }
        </div>
    )
}

export default ToolInputs