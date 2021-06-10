import { useCallback } from 'react'
import { useElementsContext } from '../../contexts/ElementsContext'
import { useToolsContext } from '../../contexts/ToolsContext'

const useTrimCommand = () => {
    const {
        selection: {
            selectedElements
        }
    } = useElementsContext()

    const { tool, addToolProp, resetTool } = useToolsContext()
    
    const handleTrimCmd = useCallback((event) => {
        if (!selectedElements) return

        if (!tool.isStarted) {
            addToolProp('isStarted', true)
            return
        }

        resetTool()
    }, [addToolProp, resetTool, selectedElements, tool.isStarted])

    return handleTrimCmd
}

export default useTrimCommand