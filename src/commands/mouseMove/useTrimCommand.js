import { useCallback } from 'react'
import { useElementsContext } from '../../contexts/ElementsContext'
import { useToolsContext } from '../../contexts/ToolsContext'
import { createElement } from '../../utils/elementFactory'
import ElementIntersector from '../../utils/elementIntersector'
import ElementTrimmer from '../../utils/elementTrimmer'

const useTrimCommand = () => {
    const {
        elements: {
            getElementsContainingPoint,
            getElementsInContainer,
            startReplacingElements,
            clearReplacingElements,
        },
        selection: {
            selectedElements,
            hasSelectedElement
        }
    } = useElementsContext()

    const { getLastReferenceClick, selectDelta, addToolProp, tool } = useToolsContext()

    const handleTrimCmd = useCallback(({ mouseX, mouseY }) => {
        if (!tool.isStarted) return

        const mousePoint = { x: mouseX, y: mouseY }
        let { selectRect } = tool
        const lastClick = getLastReferenceClick()

        if (lastClick) {
            if (!selectRect) {
                selectRect = createElement('rectangle', lastClick.x, lastClick.y)
            }
            
            selectRect.setLastAttribute(mouseX, mouseY)
            addToolProp('selectRect', selectRect)
        }

        let elementsToTrim = lastClick
                                    ? getElementsInContainer(lastClick, mousePoint, false)
                                    : getElementsContainingPoint(mouseX, mouseY, selectDelta)

        if (!elementsToTrim) {
            return clearReplacingElements()
        }

        elementsToTrim = elementsToTrim.filter(ett => !hasSelectedElement(ett.id))

        const commandResult = { replacedIds: [], replacingElements: [] }
        for (const elementToTrim of elementsToTrim) {
            const pointsOfTrim = selectedElements.reduce((acc, cse) => {
                const intersections = ElementIntersector.getIntersections(elementToTrim, cse)
                if (intersections) {
                    return [...acc, ...intersections]
                }

                return acc
            }, [])

            if (pointsOfTrim.length === 0) continue
            
            const pointsOfSelection = lastClick ? [lastClick, mousePoint] : [mousePoint]

            const resultElements = ElementTrimmer.trimElement(elementToTrim, pointsOfTrim, pointsOfSelection)
            if (resultElements) {
                commandResult.replacedIds.push(elementToTrim.id)
                commandResult.replacingElements = commandResult.replacingElements.concat(resultElements)
            }        
        }

        if (commandResult.replacedIds.length === 0) {
            return clearReplacingElements()
        }

        startReplacingElements(commandResult.replacedIds, commandResult.replacingElements)
    }, [
        addToolProp, 
        clearReplacingElements, 
        selectedElements, 
        getElementsContainingPoint, 
        getElementsInContainer, 
        getLastReferenceClick,
        selectDelta, 
        startReplacingElements,
        hasSelectedElement,
        tool
    ])

    return handleTrimCmd
}

export default useTrimCommand