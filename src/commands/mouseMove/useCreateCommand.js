import { useCallback } from 'react'
import { useAppContext } from '../../contexts/AppContext'
import ElementManipulator from '../../utils/elementManipulator'

const useCreateCommand = () => {
    const {
        elements: { currentlyCreatedElement, addCurrentlyCreatedElement }
    } = useAppContext()

    const handleCreateCmd = useCallback(
        ({ mouseX, mouseY }) => {
            const newCurrentlyCreatedElement = ElementManipulator.copyElement(currentlyCreatedElement, true)
            newCurrentlyCreatedElement.setLastAttribute(mouseX, mouseY)

            addCurrentlyCreatedElement(newCurrentlyCreatedElement)
        },
        [addCurrentlyCreatedElement, currentlyCreatedElement]
    )

    return handleCreateCmd
}

export default useCreateCommand
