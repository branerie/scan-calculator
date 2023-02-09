import { useCallback } from 'react'
import { useElementsStoreContext } from '../../contexts/ElementsStoreContext'
import Polyline from '../../drawingElements/polyline'
import { useToolsStore } from '../../stores/tools/index'
import ElementManipulator from '../../utils/elementManipulator'

const useUndoRedoCommand = () => {
  const useElementsStore = useElementsStoreContext()
  const currentlyCreatedElement = useElementsStore((state) => state.currentlyCreatedElement)
  const addCurrentlyCreatedElement = useElementsStore((state) => state.addCurrentlyCreatedElement)
  const undo = useElementsStore((state) => state.undo)
  const redo = useElementsStore((state) => state.redo)

  const tool = useToolsStore((state) => state.tool)

  const handleUndoRedoCmd = useCallback(
    (event: KeyboardEvent) => {
      if (currentlyCreatedElement && currentlyCreatedElement instanceof Polyline) {
        const createdElementCopy = ElementManipulator.copyElement(currentlyCreatedElement, {
          assignId: true,
        }) as Polyline

        const removedElement = createdElementCopy.elements.pop()!
        const removedElementLastPoint = removedElement.endPoint!

        const currentLastElement = createdElementCopy.elements[createdElementCopy.elements.length - 1]
        currentLastElement.endPoint = removedElementLastPoint

        addCurrentlyCreatedElement(createdElementCopy)

        return
      }

      if (tool.type !== 'select') {
        return
      }

      if (event.key && event.key.toLowerCase() === 'z') {
        undo()
        return
      }

      if (event.key && event.key.toLowerCase() === 'y') {
        redo()
      }
    },
    [currentlyCreatedElement, tool.type, addCurrentlyCreatedElement, undo, redo]
  )

  return handleUndoRedoCmd
}

export default useUndoRedoCommand
