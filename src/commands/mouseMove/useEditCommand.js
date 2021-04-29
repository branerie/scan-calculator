import { useCallback } from 'react'
import { useElementsContext } from '../../contexts/ElementsContext'
import { useToolsContext } from '../../contexts/ToolsContext'
import { createPoint } from '../../utils/elementFactory'
import { getPointDistance } from '../../utils/point'

const useEditCommand = () => {
    const {
        elements: {
            currentlyEditedElements,
            snappedPoint,
            changeEditingElements
        },
        selection: {
            selectedPoints
        }
    } = useElementsContext()

    const { getRealMouseCoordinates } = useToolsContext()

    const handleEditCmd = useCallback((event) => {
        const [realClientX, realClientY] = snappedPoint 
                    ? getRealMouseCoordinates(snappedPoint.x, snappedPoint.y) 
                    : getRealMouseCoordinates(event.clientX, event.clientY)

        const mousePoint = createPoint(realClientX, realClientY)

        const newCurrentlyEditedElements = []
        for (const editedElement of currentlyEditedElements) {
            for (const selectedPoint of selectedPoints) {
                const movedPoint = editedElement.getPointById(selectedPoint.pointId)
                if (!movedPoint) continue

                const dX = mousePoint.x - movedPoint.x
                const dY = mousePoint.y - movedPoint.y

                if (selectedPoint.pointType === 'midPoint') {
                    switch (editedElement.baseType) {
                        case 'line':
                            editedElement.move(dX, dY)
                            break
                        case 'polyline':
                            editedElement.stretchByMidPoint(dX, dY, selectedPoint.pointId)
                            break
                        case 'arc':
                            const newRadius = getPointDistance(editedElement.centerPoint, mousePoint)
                            editedElement.radius = newRadius
                            break
                        default:
                            // should not reach here
                            break
                    }

                    continue
                }

                if (selectedPoint.pointType === 'center') {
                    editedElement.move(dX, dY)
                }

                editedElement.setPointById(selectedPoint.pointId, mousePoint.x, mousePoint.y)
            }

            newCurrentlyEditedElements.push(editedElement)
        }

        changeEditingElements(newCurrentlyEditedElements)
    }, [currentlyEditedElements, getRealMouseCoordinates, selectedPoints, snappedPoint, changeEditingElements])

    return handleEditCmd
}

export default useEditCommand