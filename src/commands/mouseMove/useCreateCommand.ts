import { useCallback } from 'react'
import useElementsStore from '../../stores/elements/index'
import ElementManipulator from '../../utils/elementManipulator'
import { MousePosition } from '../../utils/types/index'

const useCreateCommand = () => {
  const elementsStore = useElementsStore()
  const currentlyCreatedElement = elementsStore(state => state.currentlyCreatedElement)
  const addCurrentlyCreatedElement = elementsStore(state => state.addCurrentlyCreatedElement)

  const handleCreateCmd = useCallback(({ mouseX, mouseY }: MousePosition) => {
    if (!currentlyCreatedElement || !currentlyCreatedElement.isAlmostDefined) {
      return false
    }

    const newCurrentlyCreatedElement = ElementManipulator.copyElement(
      currentlyCreatedElement, 
      { keepIds: true }
    )

    newCurrentlyCreatedElement.setLastAttribute(mouseX, mouseY)

    addCurrentlyCreatedElement(newCurrentlyCreatedElement)
    return true
  }, [addCurrentlyCreatedElement, currentlyCreatedElement])

  return handleCreateCmd
}

export default useCreateCommand
