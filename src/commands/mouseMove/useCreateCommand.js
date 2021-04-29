import { useCallback } from 'react'
import { useElementsContext } from '../../contexts/ElementsContext'
import { useToolsContext } from '../../contexts/ToolsContext'
import { createPoint } from '../../utils/elementFactory'
import ElementManipulator from '../../utils/elementManipulator'

const useCreateCommand = () => {
    const {
        elements: {
            currentlyCreatedElement,
            addCurrentlyCreatedElement,
            snappedPoint
        }
    } = useElementsContext()

    const { getRealMouseCoordinates } = useToolsContext()

    const handleCreateCmd = useCallback((event) => {
        const [realClientX, realClientY] = getRealMouseCoordinates(event.clientX, event.clientY)
        const mousePoint = snappedPoint ? snappedPoint : createPoint(realClientX, realClientY)

        const newCurrentlyCreatedElement = ElementManipulator.copyElement(currentlyCreatedElement, true)
        newCurrentlyCreatedElement.setLastAttribute(mousePoint.x, mousePoint.y)

        addCurrentlyCreatedElement(newCurrentlyCreatedElement)
    }, [addCurrentlyCreatedElement, currentlyCreatedElement, getRealMouseCoordinates, snappedPoint])

    return handleCreateCmd
}

export default useCreateCommand