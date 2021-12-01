import { useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { useAppContext } from '../../contexts/AppContext'
import { createElement, createPoint } from '../../utils/elementFactory'
import ElementManipulator from '../../utils/elementManipulator'

const useDrawCommand = () => {
    const {
        elements: {
            currentlyCreatedElement,
            addCurrentlyCreatedElement,
            removeCurrentlyCreatedElement,
            snappedPoint,
            clearSnappedPoint,
            history: { addElements }
        },
        tools: { tool, addToolClick, clearCurrentTool }
    } = useAppContext()

    const handleDrawCmd = useCallback(
        (event, clickedPoint) => {
            if (!currentlyCreatedElement) {
                const newGroupId = tool.name === 'polyline' || tool.name === 'rectangle' ? uuidv4() : null
                const newElement = createElement(tool.name, clickedPoint.x, clickedPoint.y, {
                    groupId: newGroupId
                })

                addCurrentlyCreatedElement(newElement)
                addToolClick(clickedPoint)
                return
            }

            // we are currently creating an element and it has its first point defined
            if (currentlyCreatedElement.isFullyDefined && currentlyCreatedElement.type !== 'polyline') {
                clearSnappedPoint()
                addElements([currentlyCreatedElement])
                clearCurrentTool()
                removeCurrentlyCreatedElement()
                return
            }

            const copiedPoint = snappedPoint ? createPoint(clickedPoint.x, clickedPoint.y) : clickedPoint

            const newCurrentlyCreatedElement = ElementManipulator.copyElement(currentlyCreatedElement, { keepIds: true })
            newCurrentlyCreatedElement.defineNextAttribute(copiedPoint)
            addCurrentlyCreatedElement(newCurrentlyCreatedElement)

            const isReferenceClick = tool.name !== 'arc'
            addToolClick(clickedPoint, isReferenceClick)
        },
        [
            addCurrentlyCreatedElement,
            addElements,
            clearSnappedPoint,
            snappedPoint,
            currentlyCreatedElement,
            removeCurrentlyCreatedElement,
            tool.name,
            addToolClick,
            clearCurrentTool
        ]
    )

    return handleDrawCmd
}

export default useDrawCommand
