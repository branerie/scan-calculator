import { useCallback } from 'react'
import { useElementsStoreContext } from '../../contexts/ElementsStoreContext'
import Arc from '../../drawingElements/arc'
import { ElementWithId } from '../../drawingElements/element'
import Line from '../../drawingElements/line'
import Polyline from '../../drawingElements/polyline'
import { createPoint } from '../../utils/elementFactory'
import ElementManipulator from '../../utils/elementManipulator'
import { getPointDistance } from '../../utils/point'
import { MousePosition } from '../../utils/types/index'

const useEditCommand = () => {
  const useElementsStore = useElementsStoreContext()
  const getElementById = useElementsStore((state) => state.getElementById)
  const currentlyEditedElements = useElementsStore((state) => state.currentlyEditedElements)
  const changeEditingElements = useElementsStore((state) => state.changeEditingElements)
  const selectedPoints = useElementsStore((state) => state.selectedPoints)
  const snappedPoint = useElementsStore((state) => state.snappedPoint)

  const handleEditCmd = useCallback(
    (mousePosition: MousePosition) => {
      if (!currentlyEditedElements || !selectedPoints) {
        return false
      }

      const { mouseX, mouseY } = mousePosition
      const mousePoint = snappedPoint || createPoint(mouseX, mouseY)

      const newCurrentlyEditedElements = []
      for (const editedElement of Array.from(currentlyEditedElements!.values())) {
        const originalElement = getElementById(editedElement.id)!
        const editedElementCopy = ElementManipulator.copyElement(originalElement, {
          keepIds: true,
          assignId: false,
        }) as ElementWithId

        for (const selectedPoint of selectedPoints) {
          const movedPoint = editedElementCopy.getPointById(selectedPoint.pointId)
          if (!movedPoint) {
            continue
          }

          const dX = mousePoint.x - movedPoint.x
          const dY = mousePoint.y - movedPoint.y

          if (selectedPoint.pointType === 'midPoint') {
            if (editedElementCopy instanceof Line) {
              editedElementCopy.move(dX, dY)
            } else if (editedElementCopy instanceof Polyline) {
              editedElementCopy.stretchByMidPoint(dX, dY, selectedPoint.pointId)
            } else if (editedElementCopy instanceof Arc) {
              const newRadius = getPointDistance(editedElementCopy.centerPoint, mousePoint)
              console.log('newRadius', newRadius)
              editedElementCopy.radius = newRadius
            } else {
              throw new Error(`Editing elements of type ${typeof editedElementCopy} not supported`)
            }

            continue
          }

          if (selectedPoint.pointType === 'centerPoint') {
            editedElementCopy.move(dX, dY)
          }

          editedElementCopy.setPointById(selectedPoint.pointId, mousePoint.x, mousePoint.y)
        }

        newCurrentlyEditedElements.push(editedElementCopy)
      }

      changeEditingElements(newCurrentlyEditedElements)
    },
    [currentlyEditedElements, selectedPoints, changeEditingElements]
  )

  return handleEditCmd
}

export default useEditCommand
