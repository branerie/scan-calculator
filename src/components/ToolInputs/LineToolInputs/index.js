import React from 'react'
import commonStyles from '../index.module.css'

const LineToolInputs = ({ inputValues, setInputValue }) => {
    const handleValueSet = (event) => {
        if (isNaN(Number(event.target.value))) {
            return
        }

        

        setInputValue(event)
    }

    return (
        <>
            <div className={commonStyles['form-group']}>
                <label>Start Point</label>
                <input
                    name='startPointX'
                    value={inputValues.startPointX || ''}
                    onChange={handleValueSet}
                    placeholder='X coordinate'
                />
                <input
                    name='startPointY'
                    value={inputValues.startPointY || ''}
                    onChange={handleValueSet}
                    placeholder='Y coordinate'
                />
            </div>

            <div className={commonStyles['form-group']}>
                <label>End Point</label>
                <input
                    name='endPointX'
                    value={inputValues.endPointX || ''}
                    onChange={handleValueSet}
                    placeholder='X coordinate'
                />
                <input
                    name='endPointY'
                    value={inputValues.endPointY || ''}
                    onChange={handleValueSet}
                    placeholder='Y coordinate'
                />
            </div>
        </>
    )
}

export default LineToolInputs