import { useCallback } from 'react'
import { useElementsContext } from '../../contexts/ElementsContext'
import { useToolsContext } from '../../contexts/ToolsContext'

const useCopyCommand = () => {
    const {
        elements: {
            currentlyCopiedElements,
            changeCopyingElements,
        }
    } = useElementsContext()

    const { tool, editLastToolClick } = useToolsContext()
    
    const handleCopyCmd = useCallback((mousePosition) => {
        const { mouseX, mouseY } = mousePosition

        if (tool.name === 'copy') {
            const basePoint = tool.clicks[0]
            const dX = mouseX - basePoint.x
            const dY = mouseY - basePoint.y

            const newCurrentlyCopiedElements = [...currentlyCopiedElements]
            for (const editedElement of newCurrentlyCopiedElements) {
                editedElement.move(dX, dY)
            }

            changeCopyingElements(newCurrentlyCopiedElements)
            editLastToolClick({ x: mouseX, y: mouseY })
            return
        }
    }, [currentlyCopiedElements, changeCopyingElements, tool, editLastToolClick])

    return handleCopyCmd
}

export default useCopyCommand