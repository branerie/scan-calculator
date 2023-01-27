import { useCallback } from 'react'
import Arc from '../../drawingElements/arc'
import Line from '../../drawingElements/line'
import Polyline from '../../drawingElements/polyline'
import useElementsStore from '../../stores/elements/index'
import { createPoint } from '../../utils/elementFactory'
import { getPointDistance } from '../../utils/point'
import { MousePosition } from '../../utils/types/index'

const useEditCommand = () => {
  const elementsStore = useElementsStore()
  const currentlyEditedElements = elementsStore(state => state.currentlyEditedElements)
  const changeEditingElements = elementsStore(state => state.changeEditingElements)
  const selectedPoints = elementsStore(state => state.selectedPoints)

  const handleEditCmd = useCallback((mousePosition: MousePosition) => {
    if (!currentlyEditedElements || !selectedPoints) {
      return false
    }

    const { mouseX, mouseY } = mousePosition
    const mousePoint = createPoint(mouseX, mouseY)

    const newCurrentlyEditedElements = []
    for (const editedElement of Array.from(currentlyEditedElements!.values())) {
      for (const selectedPoint of selectedPoints) {
        const movedPoint = editedElement.getPointById(selectedPoint.pointId)
        if (!movedPoint) {
          continue
        }

        const dX = mousePoint.x - movedPoint.x
        const dY = mousePoint.y - movedPoint.y

        if (selectedPoint.pointType === 'midPoint') {
          if (editedElement instanceof Line) {
            editedElement.move(dX, dY)
          } else if (editedElement instanceof Polyline) {
            editedElement.stretchByMidPoint(dX, dY, selectedPoint.pointId)
          } else if (editedElement instanceof Arc) {
            const newRadius = getPointDistance(editedElement.centerPoint, mousePoint)
            editedElement.radius = newRadius
          } else {
            throw new Error(`Editing elements of type ${typeof editedElement} not supported`)
          }

          continue
        }

        if (selectedPoint.pointType === 'centerPoint') {
          editedElement.move(dX, dY)
        }

        editedElement.setPointById(selectedPoint.pointId, mousePoint.x, mousePoint.y)
      }

      newCurrentlyEditedElements.push(editedElement)
    }

    changeEditingElements(newCurrentlyEditedElements)
  }, [
    currentlyEditedElements, 
    selectedPoints, 
    changeEditingElements
  ])

  return handleEditCmd
}

export default useEditCommand
