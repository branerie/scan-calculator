import { useCallback } from 'react'
import { useElementsContext } from '../../contexts/ElementsContext'
import ElementManipulator from '../../utils/elementManipulator'

const useCreateCommand = () => {
    const {
        elements: {
            currentlyCreatedElement,
            addCurrentlyCreatedElement,
        }
    } = useElementsContext()

    const handleCreateCmd = useCallback(({ mouseX, mouseY }) => {
        const newCurrentlyCreatedElement = ElementManipulator.copyElement(currentlyCreatedElement, true)
        newCurrentlyCreatedElement.setLastAttribute(mouseX, mouseY)

        addCurrentlyCreatedElement(newCurrentlyCreatedElement)
    }, [addCurrentlyCreatedElement, currentlyCreatedElement])

    return handleCreateCmd
}

export default useCreateCommand