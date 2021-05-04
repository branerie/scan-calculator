import { useCallback } from 'react'
import { useElementsContext } from '../../contexts/ElementsContext'
import { useToolsContext } from '../../contexts/ToolsContext'
import { getAngleBetweenLines } from '../../utils/angle'
import { getRotatedPointAroundPivot } from '../../utils/point'

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
            return
        }

        if (tool.name === 'rotate') {
            const angle = getAngleBetweenLines({
                lineAFirstPointX: tool.pivotPoint.x,
                lineAFirstPointY: tool.pivotPoint.y,
                lineASecondPointX: tool.angleStartPoint.x, 
                lineASecondPointY: tool.angleStartPoint.y,
                lineBFirstPointX: tool.pivotPoint.x,
                lineBFirstPointY: tool.pivotPoint.y,
                lineBSecondPointX: realClientX,
                lineBSecondPointY: realClientY
            })

            const newCurrentlyEditedElements = [...currentlyEditedElements]
            for (const editedElement of newCurrentlyEditedElements) {
                const selectionPoints = editedElement.getSelectionPoints()
                for (const selectionPoint of selectionPoints) {
                    const newPointPosition = getRotatedPointAroundPivot(selectionPoint, tool.pivotPoint, angle)

                    editedElement.setPointById(selectionPoint.pointId, newPointPosition.x, newPointPosition.y)
                }
            }

            changeEditingElements(newCurrentlyEditedElements)
            setTool({ ...tool, angleStartPoint: { x: realClientX, y: realClientY } })
            return
        }     
    }, [
        currentlyEditedElements, 
        snappedPoint, 
        getRealMouseCoordinates, 
        tool, 
        changeEditingElements, 
        setTool
    ])

    return handleTransformCmd
}

export default useTransformCommand