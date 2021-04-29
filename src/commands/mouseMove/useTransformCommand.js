import { useCallback } from 'react'
import { useElementsContext } from '../../contexts/ElementsContext'
import { useToolsContext } from '../../contexts/ToolsContext'
import { createPoint } from '../../utils/elementFactory'

const useTransformCommand = () => {
    const {
        elements: {
            currentlyEditedElements,
            changeEditingElements,
            snappedPoint
        }
    } = useElementsContext()

    const { tool, setTool, getRealMouseCoordinates } = useToolsContext()

    const handleTransformCmd = useCallback((event) => {
        if (!currentlyEditedElements) return

        const [realClientX, realClientY] = snappedPoint 
                    ? getRealMouseCoordinates(snappedPoint.x, snappedPoint.y) 
                    : getRealMouseCoordinates(event.clientX, event.clientY)
        
        if (tool.name === 'move') {
            if (!tool.initialClick) {
                throw new Error('Cannot make move command without having initialClick set in tools')
            }

            const dX = realClientX - tool.initialClick.x
            const dY = realClientY - tool.initialClick.y

            const newCurrentlyEditedElements =  [...currentlyEditedElements]
            newCurrentlyEditedElements.forEach(ncee => ncee.move(dX, dY))

            changeEditingElements(newCurrentlyEditedElements)
            setTool({ ...tool, initialClick: { x: realClientX, y: realClientY } })
        }
    }, [currentlyEditedElements, snappedPoint, getRealMouseCoordinates, tool, changeEditingElements, setTool])

    return handleTransformCmd
}

export default useTransformCommand