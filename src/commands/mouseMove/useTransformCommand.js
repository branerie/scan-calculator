import { useCallback } from 'react'
import { useElementsContext } from '../../contexts/ElementsContext'
import { useToolsContext } from '../../contexts/ToolsContext'
import { getAngleBetweenLines } from '../../utils/angle'
import { createLine } from '../../utils/elementFactory'
import { getPointDistance, getRotatedPointAroundPivot } from '../../utils/point'

const SCALE_SMOOTHING_FACTOR = 0.05

const useTransformCommand = () => {
    const {
        elements: {
            currentlyEditedElements,
            changeEditingElements,
            snappedPoint
        }
    } = useElementsContext()

    const { tool, setTool, editLastToolClick, getRealMouseCoordinates } = useToolsContext()

    const handleTransformCmd = useCallback((event) => {
        const [realClientX, realClientY] = snappedPoint
            ? getRealMouseCoordinates(snappedPoint.x, snappedPoint.y)
            : getRealMouseCoordinates(event.clientX, event.clientY)

        if (tool.name === 'move') {
            const initialClick = tool.clicks[0]
            const dX = realClientX - initialClick.x
            const dY = realClientY - initialClick.y

            const newCurrentlyEditedElements = [...currentlyEditedElements]
            newCurrentlyEditedElements.forEach(ncee => ncee.move(dX, dY))

            changeEditingElements(newCurrentlyEditedElements)
            editLastToolClick({ x: realClientX, y: realClientY })
            return
        }

        if (tool.name === 'rotate') {
            const [pivotPoint, angleStartPoint] = tool.clicks 

            const angle = getAngleBetweenLines({
                lineAFirstPointX: pivotPoint.x,
                lineAFirstPointY: pivotPoint.y,
                lineASecondPointX: angleStartPoint.x,
                lineASecondPointY: angleStartPoint.y,
                lineBFirstPointX: pivotPoint.x,
                lineBFirstPointY: pivotPoint.y,
                lineBSecondPointX: realClientX,
                lineBSecondPointY: realClientY
            })

            const newCurrentlyEditedElements = [...currentlyEditedElements]
            for (const editedElement of newCurrentlyEditedElements) {
                const selectionPoints = editedElement.getSelectionPoints()
                for (const selectionPoint of selectionPoints) {
                    const newPointPosition = getRotatedPointAroundPivot(selectionPoint, pivotPoint, angle)

                    editedElement.setPointById(selectionPoint.pointId, newPointPosition.x, newPointPosition.y)
                }
            }

            changeEditingElements(newCurrentlyEditedElements)
            editLastToolClick({ x: realClientX, y: realClientY })
            return
        }

        if (tool.name === 'scale') {
            const initialClick = tool.clicks[0]

            const distanceFromInitial = getPointDistance(initialClick, { x: realClientX, y: realClientY })
            const scalingFactor = Math.max(distanceFromInitial * SCALE_SMOOTHING_FACTOR, 0.001)

            const oldScalingFactor = tool.scalingFactor || 1
            const correctedScalingFactor = scalingFactor / oldScalingFactor

            const newCurrentlyEditedElements = [...currentlyEditedElements]
            for (const editedElement of newCurrentlyEditedElements) {
                const selectionPoints = editedElement.getSelectionPoints()
                for (const selectionPoint of selectionPoints) {
                    const lineToPoint = createLine(
                        initialClick.x,
                        initialClick.y,
                        null,
                        selectionPoint.x,
                        selectionPoint.y
                    )

                    lineToPoint.setLength(lineToPoint.length * correctedScalingFactor, false)
                    editedElement.setPointById(selectionPoint.pointId, lineToPoint.pointB.x, lineToPoint.pointB.y)
                    changeEditingElements(newCurrentlyEditedElements)
                }

                if (editedElement.baseType === 'arc') {
                    editedElement.radius = editedElement.radius * correctedScalingFactor
                }
            }

            changeEditingElements(newCurrentlyEditedElements)
            setTool({ ...tool, scalingFactor })

            return
        }
    }, [
        currentlyEditedElements,
        snappedPoint,
        getRealMouseCoordinates,
        tool,
        changeEditingElements,
        setTool,
        editLastToolClick,
    ])

    return handleTransformCmd
}

export default useTransformCommand