import { useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { useElementsContext } from '../../contexts/ElementsContext'
import { useToolsContext } from '../../contexts/ToolsContext'
import { createElement } from '../../utils/elementFactory'

const useDrawCommand = () => {
    const {
        elements: {
            currentlyCreatedElement,
            addCurrentlyCreatedElement,
            removeCurrentlyCreatedElement,
            clearSnappedPoint
        },
        history: {
            addElement
        }
    } = useElementsContext()

    const { tool } = useToolsContext()

    const handleDrawCmd = useCallback((event, clickedPoint) => {
        if (!currentlyCreatedElement) {
            const newGroupId = tool.name === 'polyline' || tool.name === 'rectangle' ? uuidv4() : null
            const newElement = createElement(tool.name, clickedPoint.x, clickedPoint.y, newGroupId)

            addCurrentlyCreatedElement(newElement)
            return
        }

        // we are currently creating an element and it has its first point defined
        if (currentlyCreatedElement.isFullyDefined && currentlyCreatedElement.type !== 'polyline') {
            clearSnappedPoint()
            addElement(currentlyCreatedElement)

            removeCurrentlyCreatedElement()
            return
        }

        currentlyCreatedElement.defineNextAttribute(clickedPoint)
    }, [
        addCurrentlyCreatedElement, 
        addElement, 
        clearSnappedPoint, 
        currentlyCreatedElement, 
        removeCurrentlyCreatedElement, 
        tool.name
    ])

    return handleDrawCmd
}

export default useDrawCommand