import { useCallback } from 'react'
import { useAppContext } from '../../contexts/AppContext'
import useExtendUtils from '../../hooks/utility/useExtendUtils'
import { checkIsElementStartCloserThanEnd } from '../../utils/element'
import { createElement } from '../../utils/elementFactory'
import ElementIntersector from '../../utils/elementIntersector'
import ElementManipulator from '../../utils/elementManipulator'

const useExtendCommand = () => {
    const {
        elements: {
            elements,
            getElementsContainingPoint,
            getElementsInContainer,
            getElementById,
            clearReplacingElements,
            startReplacingElements,
            pruneReplacingElements,
            selection: { hasSelectedElement }
        },
        tools: { tool, addToolProp, getLastReferenceClick, selectDelta }
    } = useAppContext()

    const { tryExtendElementEnd, validateExtendedElement } = useExtendUtils()

    const handleExtendCmd = useCallback(
        ({ mouseX, mouseY }) => {
            if (!tool.isStarted) return

            const lastClick = getLastReferenceClick()
            if (lastClick) {
                addToolProp('mousePosition', { mouseX, mouseY })
            }

            const mousePoint = { x: Number(mouseX.toFixed(3)), y: Number(mouseY.toFixed(3)) }

            let elementsToExtend = lastClick
                ? getElementsInContainer(lastClick, mousePoint, { shouldSkipPartial: false, returnGroup: 0 })
                : getElementsContainingPoint(mouseX, mouseY, { maxPointsDiff: selectDelta, returnGroup: 0 })

            if (!elementsToExtend) {
                return clearReplacingElements()
            }

            const filteredElementsToExtend = []
            const polylines = {}
            for (const elementToExtend of elementsToExtend) {
                if (hasSelectedElement(elementToExtend) || elementToExtend.type === 'circle') {
                    continue
                }

                if (elementToExtend.groupId) {
                    // will not be polyline, need to move condition
                    const polyline = getElementById(elementToExtend.groupId)
                    polylines[polyline.id] = polyline

                    if (polyline.isJoined || hasSelectedElement(polyline)) {
                        continue
                    }
                }

                filteredElementsToExtend.push(elementToExtend)
            }

            pruneReplacingElements(filteredElementsToExtend)

            // TODO: For trim/extend and possibly other commands: what if first and second click are the same point?
            const commandResult = {}
            for (const elementToExtend of filteredElementsToExtend) {
                const element = elementToExtend.groupId ? polylines[elementToExtend.groupId] : elementToExtend

                let extendPoints = null
                if (lastClick) {
                    const selectRect = createElement('rectangle', lastClick.x, lastClick.y)
                    selectRect.setLastAttribute(mousePoint.x, mousePoint.y)

                    extendPoints = ElementIntersector.getIntersections(element, selectRect)
                } else if (element.checkIfPointOnElement(mousePoint, selectDelta)) {
                    extendPoints = [mousePoint]
                }

                if (!extendPoints) continue

                const nearestEndPoints = checkIsElementStartCloserThanEnd(
                    element,
                    extendPoints,
                    elementToExtend.groupId ? elementToExtend : null
                )

                const shouldExtendStart = nearestEndPoints.some(nep => nep)
                const shouldExtendEnd = nearestEndPoints.some(nep => !nep)

                let newStartPos = null
                let newEndPos = null
                if (shouldExtendStart) {
                    newStartPos = tryExtendElementEnd(elementToExtend, true)
                }

                if (shouldExtendEnd) {
                    newEndPos = tryExtendElementEnd(elementToExtend, false)
                }

                if (newStartPos || newEndPos) {
                    let editedElement = ElementManipulator.copyElement(element, false)

                    if (newStartPos) {
                        editedElement.startPoint = newStartPos
                    }

                    if (newEndPos) {
                        editedElement.endPoint = newEndPos
                    }

                    editedElement = validateExtendedElement(editedElement)

                    commandResult[elementToExtend.id] = { replacingElements: [], removedSections: [] }
                    commandResult[elementToExtend.id].replacingElements.push(editedElement)
                    commandResult[elementToExtend.id].removedSections.push(elementToExtend)
                    // commandResult[element.id] = { replacingElements: [], removedSections: [] }
                    // commandResult[element.id].replacingElements.push(editedElement)
                    // commandResult[element.id].removedSections.push(element)
                }
            }

            if (Object.keys(commandResult).length) {
                startReplacingElements(commandResult)
            }
        },
        [
            addToolProp,
            getElementsContainingPoint,
            getElementsInContainer,
            getLastReferenceClick,
            getElementById,
            hasSelectedElement,
            selectDelta,
            clearReplacingElements,
            pruneReplacingElements,
            startReplacingElements,
            tryExtendElementEnd,
            tool.isStarted,
            validateExtendedElement
        ]
    )

    return handleExtendCmd
}

export default useExtendCommand
