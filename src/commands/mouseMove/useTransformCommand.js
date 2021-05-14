import { useCallback } from 'react'
import { useElementsContext } from '../../contexts/ElementsContext'
import { useToolsContext } from '../../contexts/ToolsContext'
import { createLine } from '../../utils/elementFactory'
import { getPerpendicularPointToLine } from '../../utils/line'
import { getPointDistance, getRotatedPointAroundPivot } from '../../utils/point'

const SCALE_SMOOTHING_FACTOR = 0.05

const useTransformCommand = () => {
    const {
        elements: {
            currentlyEditedElements,
            changeEditingElements,
            snappedPoint,
            getElementById
        }
    } = useElementsContext()

    const { tool, getRealMouseCoordinates, currentScale } = useToolsContext()

    const handleTransformCmd = useCallback(({ mouseX, mouseY }) => {
        const [realClientX, realClientY] = snappedPoint
            ? getRealMouseCoordinates(snappedPoint.x, snappedPoint.y)
            : getRealMouseCoordinates(mouseX, mouseY)

        if (tool.name === 'move') {
            const initialClick = tool.clicks[0]

            const firstEditedElement = currentlyEditedElements[0]
            const originalFirstElement = getElementById(firstEditedElement.id)
            const previousDx = firstEditedElement.basePoint.x - originalFirstElement.basePoint.x
            const previousDy = firstEditedElement.basePoint.y - originalFirstElement.basePoint.y

            const dX = realClientX - initialClick.x - previousDx
            const dY = realClientY - initialClick.y - previousDy

            const newCurrentlyEditedElements = [...currentlyEditedElements]
            newCurrentlyEditedElements.forEach(ncee => ncee.move(dX, dY))

            changeEditingElements(newCurrentlyEditedElements)
            return
        }

        if (tool.name === 'rotate') {
            const pivotPoint = tool.clicks[0]

            const lineFromPivot = createLine(pivotPoint.x, pivotPoint.y, realClientX, realClientY)
            const angle = 360 - lineFromPivot.angle

            const newCurrentlyEditedElements = [...currentlyEditedElements]
            for (const editedElement of newCurrentlyEditedElements) {
                const elementBeforeEdit = getElementById(editedElement.id)
                const selectionPoints = elementBeforeEdit.getSelectionPoints()

                for (const selectionPoint of selectionPoints) {
                    const newPointPosition = getRotatedPointAroundPivot(selectionPoint, pivotPoint, angle)

                    editedElement.setPointById(selectionPoint.pointId, newPointPosition.x, newPointPosition.y)
                }
            }

            changeEditingElements(newCurrentlyEditedElements)
            return
        }

        if (tool.name === 'mirror') {
            const mirrorFirstPoint = tool.clicks[0]
            const mirrorLine = createLine(mirrorFirstPoint.x, mirrorFirstPoint.y, realClientX, realClientY)

            const newCurrentlyEditedElements = [...currentlyEditedElements]
            for (const editedElement of newCurrentlyEditedElements) {
                const elementBeforeEdit = getElementById(editedElement.id)
                const selectionPoints = elementBeforeEdit.getSelectionPoints()

                for (const selectionPoint of selectionPoints) {
                    const perpPoint = getPerpendicularPointToLine(selectionPoint, mirrorLine)
                    const newPointX = selectionPoint.x + (perpPoint.x - selectionPoint.x) * 2
                    const newPointY = selectionPoint.y + (perpPoint.y - selectionPoint.y) * 2

                    editedElement.setPointById(selectionPoint.pointId, newPointX, newPointY)
                }

                if (editedElement.baseType === 'arc') {
                    // in case of mirrored arc start and end need to be switched, otherwise it breaks 
                    const startPoint = editedElement.startPoint
                    const endPoint = editedElement.endPoint

                    editedElement.setPointById(startPoint.pointId, endPoint.x, endPoint.y)
                    editedElement.setPointById(endPoint.pointId, startPoint.x, startPoint.y)
                }
            }

            changeEditingElements(newCurrentlyEditedElements)
            return
        }

        if (tool.name === 'scale') {
            const initialClick = tool.clicks[0]

            const distanceFromInitial = getPointDistance(initialClick, { x: realClientX, y: realClientY })
            const scalingFactor = Math.max(distanceFromInitial * SCALE_SMOOTHING_FACTOR * currentScale ** 2, 0.001)

            const newCurrentlyEditedElements = [...currentlyEditedElements]
            for (const editedElement of newCurrentlyEditedElements) {
                const elementBeforeEdit = getElementById(editedElement.id)
                const selectionPoints = elementBeforeEdit.getSelectionPoints()

                for (const selectionPoint of selectionPoints) {
                    const lineToPoint = createLine(
                        initialClick.x,
                        initialClick.y,
                        selectionPoint.x,
                        selectionPoint.y
                    )

                    lineToPoint.setLength(lineToPoint.length * scalingFactor, false)
                    editedElement.setPointById(selectionPoint.pointId, lineToPoint.pointB.x, lineToPoint.pointB.y)
                }

                if (editedElement.baseType === 'arc') {
                    editedElement.radius = elementBeforeEdit.radius * scalingFactor
                }
            }

            changeEditingElements(newCurrentlyEditedElements)
            return
        }
    }, [
        snappedPoint, 
        getRealMouseCoordinates, 
        tool, 
        currentlyEditedElements, 
        changeEditingElements, 
        getElementById,
        currentScale
    ])

    return handleTransformCmd
}

export default useTransformCommand