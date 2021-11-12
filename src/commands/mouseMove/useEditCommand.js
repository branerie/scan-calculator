import { useCallback } from 'react'
import { useAppContext } from '../../contexts/AppContext'
import { createPoint } from '../../utils/elementFactory'
import { getPointDistance } from '../../utils/point'

const useEditCommand = () => {
    const {
        elements: {
            currentlyEditedElements,
            changeEditingElements,
            selection: { selectedPoints }
        }
    } = useAppContext()

    const handleEditCmd = useCallback(
        mousePosition => {
            const { mouseX, mouseY } = mousePosition
            const mousePoint = createPoint(mouseX, mouseY)

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
        },
        [currentlyEditedElements, selectedPoints, changeEditingElements]
    )

    return handleEditCmd
}

export default useEditCommand
