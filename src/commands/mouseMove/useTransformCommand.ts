import { useCallback } from 'react'
import Arc from '../../drawingElements/arc'
import { ElementWithId } from '../../drawingElements/element'
import useElementsStore from '../../stores/elements/index'
import { useToolsStore } from '../../stores/tools/index'
import { createLine } from '../../utils/elementFactory'
import ElementManipulator from '../../utils/elementManipulator'
import { getPerpendicularPointToLine } from '../../utils/line'
import { getPointDistance, getRotatedPointAroundPivot } from '../../utils/point'
import { MousePosition } from '../../utils/types/index'

const SCALE_SMOOTHING_FACTOR = 0.05

const useTransformCommand = () => {
  const elementsStore = useElementsStore()
  const currentlyEditedElements = elementsStore(state => state.currentlyEditedElements)
  const changeEditingElements = elementsStore(state => state.changeEditingElements)
  const getElementById = elementsStore(state => state.getElementById)

  const toolsStore = useToolsStore()
  const tool = toolsStore(state => state.tool)
  const toolClicks = toolsStore(state => state.toolClicks)
  const currentScale = toolsStore(state => state.currentScale)

  const handleTransformCmd = useCallback(({ mouseX, mouseY }: MousePosition) => {
    if (!currentlyEditedElements) {
      return false
    }

    if (!toolClicks || !toolClicks.length) {
      return true
    }

    if (tool.name === 'move') {
      const initialClick = toolClicks[0]

      const firstEditedElement = currentlyEditedElements.values().next().value as ElementWithId
      const originalFirstElement = getElementById(firstEditedElement.id)!
      const previousDx = firstEditedElement.basePoint!.x - originalFirstElement.basePoint!.x
      const previousDy = firstEditedElement.basePoint!.y - originalFirstElement.basePoint!.y

      const dX = mouseX - initialClick.x - previousDx
      const dY = mouseY - initialClick.y - previousDy

      const newCurrentlyEditedElements = new Map(currentlyEditedElements)
      for (const editedElement of newCurrentlyEditedElements.values()) {
        const newEditedElement = ElementManipulator.copyElement(
          editedElement,
          { keepIds: true, assignId: false }
        ) as ElementWithId

        newEditedElement.move(dX, dY)
        newCurrentlyEditedElements.set(newEditedElement.id, newEditedElement)
      }

      changeEditingElements(newCurrentlyEditedElements)
      return true
    }

    if (tool.name === 'rotate') {
      const pivotPoint = toolClicks[0]

      const lineFromPivot = createLine(pivotPoint.x, pivotPoint.y, mouseX, mouseY)
      const angle = 360 - lineFromPivot.angle

      const newCurrentlyEditedElements = new Map(currentlyEditedElements)
      for (const editedElement of newCurrentlyEditedElements.values()) {
        const elementBeforeEdit = getElementById(editedElement.id)!
        const selectionPoints = elementBeforeEdit.getSelectionPoints()

        const newEditedElement = ElementManipulator.copyElement(
          editedElement,
          { keepIds: true, assignId: false }
        )

        for (const selectionPoint of selectionPoints) {
          const newPointPosition = getRotatedPointAroundPivot(selectionPoint, pivotPoint, angle)

          newEditedElement.setPointById(
            selectionPoint.pointId,
            newPointPosition.x,
            newPointPosition.y
          )
        }
      }

      changeEditingElements(newCurrentlyEditedElements)
      return true
    }

    if (tool.name === 'mirror') {
      const mirrorFirstPoint = toolClicks[0]
      const mirrorLine = createLine(mirrorFirstPoint.x, mirrorFirstPoint.y, mouseX, mouseY)

      const newCurrentlyEditedElements = new Map(currentlyEditedElements)
      for (const editedElement of newCurrentlyEditedElements.values()) {
        const newEditedElement = ElementManipulator.copyElement(
          editedElement,
          { keepIds: true, assignId: false }
        ) as ElementWithId;
        const elementBeforeEdit = getElementById(editedElement.id)!
        const selectionPoints = elementBeforeEdit.getSelectionPoints()

        for (const selectionPoint of selectionPoints) {
          const perpPoint = getPerpendicularPointToLine(selectionPoint, mirrorLine)
          const newPointX = selectionPoint.x + (perpPoint.x - selectionPoint.x) * 2
          const newPointY = selectionPoint.y + (perpPoint.y - selectionPoint.y) * 2

          newEditedElement.setPointById(selectionPoint.pointId, newPointX, newPointY)
        }

        if (newEditedElement instanceof Arc) {
          // in case of mirrored arc start and end need to be switched, otherwise it breaks
          const startPoint = newEditedElement.startPoint
          const endPoint = newEditedElement.endPoint

          newEditedElement.setPointById(startPoint!.pointId!, endPoint!.x, endPoint!.y)
          newEditedElement.setPointById(endPoint!.pointId!, startPoint!.x, startPoint!.y)
        }

        newCurrentlyEditedElements.set(editedElement.id, newEditedElement)
      }

      changeEditingElements(newCurrentlyEditedElements)
      return true
    }

    if (tool.name === 'scale') {
      const initialClick = toolClicks[0]

      const distanceFromInitial = getPointDistance(initialClick, {
        x: Number(mouseX.toFixed(3)),
        y: Number(mouseY.toFixed(3))
      })
      const scalingFactor = Math.max(
        distanceFromInitial * SCALE_SMOOTHING_FACTOR * currentScale,
        0.001
      )

      const newCurrentlyEditedElements = new Map(currentlyEditedElements)
      for (const editedElement of newCurrentlyEditedElements.values()) {
        const elementBeforeEdit = getElementById(editedElement.id)!
        const selectionPoints = elementBeforeEdit.getSelectionPoints()
        const newEditedElement = ElementManipulator.copyElement(
          editedElement,
          {  keepIds: true, assignId: false }
        ) as ElementWithId

        for (const selectionPoint of selectionPoints) {
          const lineToPoint = createLine(
            initialClick.x,
            initialClick.y,
            selectionPoint.x,
            selectionPoint.y
          )

          lineToPoint.setLength(lineToPoint.length * scalingFactor, false)
          newEditedElement.setPointById(
            selectionPoint.pointId,
            lineToPoint.pointB.x,
            lineToPoint.pointB.y
          )
        }

        if (newEditedElement instanceof Arc) {
          newEditedElement.radius = (elementBeforeEdit as Arc).radius * scalingFactor
        }

        newCurrentlyEditedElements.set(newEditedElement.id, newEditedElement)
      }

      changeEditingElements(newCurrentlyEditedElements)
      return true
    }

    return true
  }, [
    tool, 
    toolClicks,
    currentlyEditedElements, 
    changeEditingElements, 
    getElementById, 
    currentScale
  ])

  return handleTransformCmd
}

export default useTransformCommand
