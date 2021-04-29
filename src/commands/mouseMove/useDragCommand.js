import { useCallback } from 'react'
import { useToolsContext } from '../../contexts/ToolsContext'

const useDragCommand = () => {
    const { mouseDrag, panView } = useToolsContext()

    const handleDragCmd = useCallback((event) => {
        const { clientX, clientY } = event
        panView(mouseDrag[0], mouseDrag[1], clientX, clientY)
    }, [mouseDrag, panView])

    return handleDragCmd
}

export default useDragCommand