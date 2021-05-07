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
            addElements
        }
    } = useElementsContext()

    const { tool, addToolClick } = useToolsContext()

    const handleDrawCmd = useCallback((event, clickedPoint) => {
        if (!currentlyCreatedElement) {
            const newGroupId = tool.name === 'polyline' || tool.name === 'rectangle' ? uuidv4() : null
            const newElement = createElement(tool.name, clickedPoint.x, clickedPoint.y, newGroupId)

            addCurrentlyCreatedElement(newElement)
            addToolClick(clickedPoint)
            return
        }

        // we are currently creating an element and it has its first point defined
        if (currentlyCreatedElement.isFullyDefined && currentlyCreatedElement.type !== 'polyline') {
            clearSnappedPoint()
            addElements([currentlyCreatedElement])

            removeCurrentlyCreatedElement()
            return
        }

        currentlyCreatedElement.defineNextAttribute(clickedPoint)
        addToolClick(clickedPoint)
    }, [
        addCurrentlyCreatedElement, 
        addElements, 
        clearSnappedPoint, 
        currentlyCreatedElement, 
        removeCurrentlyCreatedElement, 
        tool.name,
        addToolClick
    ])

    return handleDrawCmd
}

export default useDrawCommand