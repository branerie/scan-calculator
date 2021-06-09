import { useCallback } from 'react'
import { useElementsContext } from '../../contexts/ElementsContext'
import { useToolsContext } from '../../contexts/ToolsContext'
import { createElement } from '../../utils/elementFactory'
import ElementIntersector from '../../utils/elementIntersector'
import ElementManipulator from '../../utils/elementManipulator'
import ElementTrimmer from '../../utils/elementTrimmer'
import { getPointDistance } from '../../utils/point'

const useTrimCommand = ({ mouseX, mouseY }) => {
    const {
        elements: {
            getElementsContainingPoint,
            getElementsInContainer
        },
        selection: {
            currentlySelectedElements
        }
    } = useElementsContext()

    const { getLastReferenceClick, selectDelta, addToolProp, tool } = useToolsContext()

    const handleTrimCmd = useCallback(() => {
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

        const elementsToTrim = lastClick
                                    ? getElementsInContainer(lastClick, mousePoint, false)
                                    : getElementsContainingPoint(mouseX, mouseY, selectDelta)

        if (!elementsToTrim) return

        const trimmedElements = []
        for (const elementToTrim of elementsToTrim) {
            const pointsOfTrim = currentlySelectedElements.reduce((acc, cse) => {
                const intersections = ElementIntersector.getIntersections(elementToTrim, cse)
                if (intersections) {
                    return [...acc, ...intersections]
                }

                return acc
            }, [])

            if (pointsOfTrim.length === 0) return

            // const pointsOfSelection = selectRect 
            //                             ? ElementIntersector.getIntersections(elementToTrim, selectRect)
            //                             : [mousePoint]
            const pointsOfSelection = lastClick ? [lastClick, mousePoint] : [mousePoint]

            const resultElements = ElementTrimmer.trimElement(elementToTrim, pointsOfTrim, pointsOfSelection)

            
        }
    }, [getElementsContainingPoint, getElementsInContainer, getLastReferenceClick, mouseX, mouseY, selectDelta])

    return handleTrimCmd
}

export default useTrimCommand