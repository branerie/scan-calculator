import { useCallback } from 'react'
import { useElementsStoreContext } from '../../contexts/ElementsStoreContext'
import ElementManipulator from '../../utils/elementManipulator'
import { MousePosition } from '../../utils/types/index'

const useCreateCommand = () => {
  const useElementsStore = useElementsStoreContext()
  const currentlyCreatedElement = useElementsStore((state) => state.currentlyCreatedElement)
  const addCurrentlyCreatedElement = useElementsStore((state) => state.addCurrentlyCreatedElement)
  const snappedPoint = useElementsStore((state) => state.snappedPoint)

  const handleCreateCmd = useCallback(
    ({ mouseX, mouseY }: MousePosition) => {
      if (!currentlyCreatedElement || !currentlyCreatedElement.isAlmostDefined) {
        return false
      }

      const newCurrentlyCreatedElement = ElementManipulator.copyElement(currentlyCreatedElement, {
        keepIds: true,
      })

      newCurrentlyCreatedElement.setLastAttribute(mouseX, mouseY)
      addCurrentlyCreatedElement(newCurrentlyCreatedElement)
      return true
    },
    [addCurrentlyCreatedElement, currentlyCreatedElement]
  )

  return handleCreateCmd
}

export default useCreateCommand
