import { useCallback } from 'react'
import { useElementsContext } from '../../contexts/ElementsContext'
import { useToolsContext } from '../../contexts/ToolsContext'

const useCopyCommand = () => {
    const {
        elements: {
            moveCopyingElements,
        }
    } = useElementsContext()

    const { tool, setTool } = useToolsContext()
    
    const handleCopyCmd = useCallback((mousePosition) => {
        const { mouseX, mouseY } = mousePosition

        if (tool.name === 'copy') {
            const basePoint = tool.currentPos ? tool.currentPos : tool.clicks[0]

            const dX = mouseX - basePoint.x
            const dY = mouseY - basePoint.y

            moveCopyingElements(dX, dY)
            setTool(currTool => ({ ...currTool, currentPos: { x: Number(mouseX.toFixed(3)), y: Number(mouseY.toFixed(3)) } }))
            return
        }
    }, [moveCopyingElements, tool, setTool])

    return handleCopyCmd
}

export default useCopyCommand