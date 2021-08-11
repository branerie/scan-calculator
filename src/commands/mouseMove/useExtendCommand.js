import { useCallback } from 'react'
import { useElementsContext } from '../../contexts/ElementsContext'
import { useToolsContext } from '../../contexts/ToolsContext'
import useExtendUtils from '../../hooks/utility/useExtendUtils'
import { checkIsElementStartCloserThanEnd } from '../../utils/element'
import { createElement } from '../../utils/elementFactory'
import ElementIntersector from '../../utils/elementIntersector'

const useTrimCommand = () => {
    const {
        elements: {
            getElementsContainingPoint,
            getElementsInContainer,
            getElementById,
            isEditingElement,
            stopEditingElements,
        },
        selection: {
            hasSelectedElement
        }
    } = useElementsContext()

    const { tool, addToolProp, getLastReferenceClick, selectDelta } = useToolsContext()
    const { tryExtendElementEnd } = useExtendUtils()

    const handleExtendCmd = useCallback(({ mouseX, mouseY }) => {
        if (!tool.isStarted) return

        const lastClick = getLastReferenceClick()
        if (lastClick) {
            addToolProp('mousePosition', { mouseX, mouseY })
        }
        
        const mousePoint = { x: Number(mouseX.toFixed(3)), y: Number(mouseY.toFixed(3)) }
        
        let elementsToExtend = lastClick
                                ? getElementsInContainer(lastClick, mousePoint, false, false) // return group or not?
                                : getElementsContainingPoint(mouseX, mouseY, selectDelta, false) // return group or not?
        
        if (!elementsToExtend) {
            return stopEditingElements()
        }

        const filteredElementsToExtend = []
        const polylines = {}
        for (const elementToExtend of elementsToExtend) {
            if (hasSelectedElement(elementToExtend) || elementToExtend.type === 'circle') {
                continue
            }
    
            if (elementToExtend.groupId) { // will not be polyline, need to move condition
                const polyline = getElementById(elementToExtend.groupId)
                polylines[polyline.id] = polyline

                if (polyline.isJoined || hasSelectedElement(polyline)) {
                    continue
                }
            }
    
            filteredElementsToExtend.push(elementToExtend)
        }

        if (filteredElementsToExtend.length === 0) {
            return stopEditingElements()
        }

        // TODO: For trim/extend and possibly other commands: what if first and second click are the same point?
        for (const elementToExtend of elementsToExtend) {
            const element = elementToExtend.groupId 
                                ? polylines[elementToExtend.groupId]
                                : elementToExtend

            let extendPoints = null
            if (lastClick) {
                const selectRect = createElement('rectangle', lastClick.x, lastClick.y)
                selectRect.setLastAttribute(mousePoint.x, mousePoint.y)

                extendPoints = ElementIntersector.getIntersections(element, selectRect)
            } else if (element.checkIfPointOnElement(mousePoint, selectDelta)) {
                extendPoints = [mousePoint]
            }

            if (!extendPoints) continue

            let shouldExtendStart = false
            let shouldExtendEnd = false
            for (const extendPoint of extendPoints) {
                const nearestEndPoints = checkIsElementStartCloserThanEnd(
                    element, 
                    extendPoint, 
                    elementToExtend.groupId ? elementToExtend : null
                )

                for (const isCloserToStart of Object.values(nearestEndPoints)) {
                    shouldExtendStart = shouldExtendStart || isCloserToStart
                    shouldExtendEnd = shouldExtendEnd || !isCloserToStart
                }
            }

            if (shouldExtendStart) {
                tryExtendElementEnd(elementToExtend, true)
            }

            if (shouldExtendEnd) {
                tryExtendElementEnd(elementToExtend, false)
            }
        }

    }, [
        addToolProp, 
        getElementsContainingPoint, 
        getElementsInContainer, 
        getLastReferenceClick,
        getElementById,
        hasSelectedElement, 
        selectDelta, 
        stopEditingElements, 
        tryExtendElementEnd,
        tool.isStarted
    ])

    return handleExtendCmd
}

export default useTrimCommand