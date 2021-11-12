import { useCallback } from 'react'
import { useAppContext } from '../../contexts/AppContext'

const useSelectCommand = () => {
    const {
        tools: { 
            addToolProp 
        }
    } = useAppContext()

    const handleSelectCmd = useCallback((mousePosition) => {
        addToolProp('mousePosition', mousePosition)
    }, [addToolProp])

    return handleSelectCmd
}

export default useSelectCommand

/*

*/