import { useCallback } from 'react'
import { useAppContext } from '../../contexts/AppContext'

const useCopyCommand = () => {
    const {
        elements: { moveCopyingElements },
        tools: { tool, addToolProp }
    } = useAppContext()

    const handleCopyCmd = useCallback(
        mousePosition => {
            const { mouseX, mouseY } = mousePosition

            if (tool.name === 'copy') {
                const basePoint = tool.currentPos ? tool.currentPos : tool.clicks[0]

                const dX = mouseX - basePoint.x
                const dY = mouseY - basePoint.y

                moveCopyingElements(dX, dY)
                addToolProp(
                    'currentPos',
                    { x: Number(mouseX.toFixed(3)), y: Number(mouseY.toFixed(3)) }
                )
                
                return
            }
        },
        [moveCopyingElements, tool, addToolProp]
    )

    return handleCopyCmd
}

export default useCopyCommand
