import { useCallback } from 'react'
import { useElementsContext } from '../../contexts/ElementsContext'
import { useToolsContext } from '../../contexts/ToolsContext'

const useCopyCommand = () => {
    const {
        elements: {
            currentlyCopiedElements,
            changeCopyingElements,
            snappedPoint
        }
    } = useElementsContext()

    const { tool, setTool, getRealMouseCoordinates } = useToolsContext()
    
    const handleCopyCmd = useCallback((event) => {
        const [realClientX, realClientY] = snappedPoint 
                    ? getRealMouseCoordinates(snappedPoint.x, snappedPoint.y) 
                    : getRealMouseCoordinates(event.clientX, event.clientY)

        if (tool.name === 'copy') {
            const { basePoint } = tool
            const dX = realClientX - basePoint.x
            const dY = realClientY - basePoint.y

            const newCurrentlyCopiedElements = [...currentlyCopiedElements]
            for (const editedElement of newCurrentlyCopiedElements) {
                editedElement.move(dX, dY)
            }

            changeCopyingElements(newCurrentlyCopiedElements)
            setTool({ ...tool, basePoint: { x: realClientX, y: realClientY } })
            return
        }
    }, [currentlyCopiedElements, changeCopyingElements, tool, setTool, getRealMouseCoordinates, snappedPoint])

    return handleCopyCmd
}

export default useCopyCommand