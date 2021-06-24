import { useCallback } from 'react'
import { useElementsContext } from '../../contexts/ElementsContext'
import { useToolsContext } from '../../contexts/ToolsContext'
import ElementIntersector from '../../utils/elementIntersector'
import ElementTrimmer from '../../utils/elementTrimmer'
import { pointsMatch } from '../../utils/point'

const useTrimCommand = () => {
    const {
        elements: {
            getElementsContainingPoint,
            getElementsInContainer,
            startReplacingElements,
            clearReplacingElements,
            isReplacingElement,
            getElementById
        },
        selection: {
            selectedElements,
            hasSelectedElement
        }
    } = useElementsContext()

    const { getLastReferenceClick, selectDelta, addToolProp, tool } = useToolsContext()

    const getElementTrimPoints = useCallback((elementToTrim) => {
        return selectedElements.reduce((acc, cse) => {
            let intersections = ElementIntersector.getIntersections(elementToTrim, cse)
            if (intersections) {
                const elementStartPoint = elementToTrim.startPoint
                if (elementStartPoint) {
                    intersections = intersections.filter(int => 
                        !pointsMatch(int, elementStartPoint) && !pointsMatch(int, elementToTrim.endPoint))
                }

                return [...acc, ...intersections]
            }

            return acc
        }, [])
    }, [selectedElements])

    const handleTrimCmd = useCallback(({ mouseX, mouseY }) => {
        if (!tool.isStarted) return

        const lastClick = getLastReferenceClick()
        if (lastClick) {
            addToolProp('mousePosition', { mouseX, mouseY })
        }
        
        const mousePoint = { x: mouseX, y: mouseY }
        
        let elementsToTrim = lastClick
                                ? getElementsInContainer(lastClick, mousePoint, false, false)
                                : getElementsContainingPoint(mouseX, mouseY, selectDelta, false)
        
        if (!elementsToTrim) {
            return clearReplacingElements()
        }
        
        elementsToTrim = elementsToTrim.filter(ett => !hasSelectedElement(ett) && !isReplacingElement(ett))
        
        // const commandResult = { replacedIds: [], replacingElements: [], removedSections: [] }
        const pointsOfSelection = lastClick ? [lastClick, mousePoint] : [mousePoint]

        const commandResult = {}
        const polylines = {}
        for (const elementToTrim of elementsToTrim) {
            const pointsOfTrim = getElementTrimPoints(elementToTrim)

            if (pointsOfTrim.length === 0) continue

            if (elementToTrim.groupId) {
                const polylineId = elementToTrim.groupId

                if (!polylines[polylineId]) {
                    polylines[polylineId] = {}
                }

                polylines[polylineId][elementToTrim.id] = pointsOfTrim
                continue
            }
            
            // if (pointsOfTrim.length === 1 && 
            //     checkIfEdgeTrim(pointsOfTrim[0], elementToTrim.startPoint, elementToTrim.endPoint)
            // ) {
            //     continue
            // }

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

        for (const [polylineId, trimPoints] of Object.entries(polylines)) {
            const elementToTrim = getElementById(polylineId)

            for (const subElement of elementToTrim.elements) {
                if (trimPoints[subElement.id]) continue

                const newTrimPoints = getElementTrimPoints(subElement)
                trimPoints[subElement.id] = newTrimPoints
            }
            
            const resultElements = ElementTrimmer.trimElement(elementToTrim, trimPoints, pointsOfSelection)
            if (resultElements) {
                commandResult[elementToTrim.id] = {
                    replacingElements: resultElements.remaining,
                    removedSections: resultElements.removed
                }
            }
        }

        if (Object.keys(commandResult).length === 0) {
            return clearReplacingElements()
        }

        startReplacingElements(commandResult)
    }, [
        addToolProp, 
        clearReplacingElements, 
        getElementsContainingPoint, 
        getElementsInContainer, 
        getElementById, 
        getLastReferenceClick, 
        selectDelta, 
        startReplacingElements, 
        hasSelectedElement, 
        isReplacingElement, 
        tool, 
        getElementTrimPoints
    ])

    return handleTrimCmd
}

export default useTrimCommand