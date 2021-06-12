import { useCallback } from 'react'
import { useElementsContext } from '../../contexts/ElementsContext'
import { useToolsContext } from '../../contexts/ToolsContext'
import ElementIntersector from '../../utils/elementIntersector'
import ElementTrimmer from '../../utils/elementTrimmer'

const useTrimCommand = () => {
    const {
        elements: {
            getElementsContainingPoint,
            getElementsInContainer,
            startReplacingElements,
            clearReplacingElements,
            isReplacingElement,
        },
        selection: {
            selectedElements,
            hasSelectedElement
        }
    } = useElementsContext()

    const { getLastReferenceClick, selectDelta, addToolProp, tool } = useToolsContext()

    const handleTrimCmd = useCallback(({ mouseX, mouseY }) => {
        if (!tool.isStarted) return

        const lastClick = getLastReferenceClick()
        if (lastClick) {
            addToolProp('mousePosition', { mouseX, mouseY })
        }
        
        const mousePoint = { x: mouseX, y: mouseY }
        let elementsToTrim = lastClick
                                ? getElementsInContainer(lastClick, mousePoint, false)
                                : getElementsContainingPoint(mouseX, mouseY, selectDelta)

        if (!elementsToTrim) {
            return clearReplacingElements()
        }

        elementsToTrim = elementsToTrim.filter(ett => !hasSelectedElement(ett.id) && !isReplacingElement(ett.id))

        // const commandResult = { replacedIds: [], replacingElements: [], removedSections: [] }
        const commandResult = {}
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
                commandResult[elementToTrim.id] = {
                    replacingElements: resultElements.remaining,
                    removedSections: resultElements.removed
                }
                // commandResult.replacedIds.push(elementToTrim.id)
                // commandResult.replacingElements = commandResult.replacingElements.concat(resultElements.remaining)
                // commandResult.removedSections = commandResult.removedSections.concat(resultElements.removed)
            }        
        }

        if (Object.keys(commandResult).length === 0) {
            return clearReplacingElements()
        }

        startReplacingElements(commandResult)
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
        isReplacingElement,
        tool
    ])

    return handleTrimCmd
}

export default useTrimCommand