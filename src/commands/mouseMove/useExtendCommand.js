import { useCallback } from 'react'
import { useAppContext } from '../../contexts/AppContext'
import useExtendUtils from '../../hooks/utility/useExtendUtils'
import { SELECT_DELTA } from '../../utils/constants'
import { checkIsElementStartCloserThanEnd } from '../../utils/element'
import { createArc, createElement, createLine, createPoint } from '../../utils/elementFactory'
import ElementIntersector from '../../utils/elementIntersector'
import ElementManipulator from '../../utils/elementManipulator'
import { pointsMatch } from '../../utils/point'

const getArcFromExtendedPoint = (original, result, stationary, center) => {
    const extensionArc = createArc(center, original, result)
    if (extensionArc.checkIfPointOnElement(stationary)) {
        // extension arc should not contain the other point of the arc
        extensionArc.startPoint = result
        extensionArc.endPoint = original
    }

    return extensionArc
}

const getExtensionDifference = (original, result) => {
    if (original.baseType !== result.baseType) {
        return null
    }

    switch (original.type) {
        case 'line': {
            const isStartSame = pointsMatch(original.startPoint, result.startPoint)
            const isEndSame = pointsMatch(original.endPoint, result.endPoint)

            const extensionLines = []
            if (!isStartSame) {
                const extensionLine = createLine(
                    original.startPoint.x,
                    original.startPoint.y,
                    result.startPoint.x,
                    result.startPoint.y,
                    { assignId: false }
                )

                extensionLines.push(extensionLine)
            }

            if (!isEndSame) {
                const extensionLine = createLine(
                    original.endPoint.x,
                    original.endPoint.y,
                    result.endPoint.x,
                    result.endPoint.y,
                    { assignId: false }
                )

                extensionLines.push(extensionLine)
            }

            return extensionLines
        }
        case 'arc': {
            const isCenterSame = pointsMatch(original.centerPoint, result.centerPoint)
            if (!isCenterSame) {
                return null
            }

            if (result.type === 'circle') {
                // the arc has been closed, extension difference is just the original arc
                // with start and end points switched
                const extensionArc = ElementManipulator.copyArc(original, false, false)
                extensionArc.startPoint = original.endPoint
                extensionArc.endPoint = original.startPoint
                return [extensionArc]
            }

            const isStartSame = pointsMatch(original.startPoint, result.startPoint)
            const isEndSame = pointsMatch(original.endPoint, result.endPoint)

            const extensionElements = []
            let staticPoint, originalPoint, resultPoint
            if (!isStartSame) {
                staticPoint = original.endPoint
                originalPoint = original.startPoint
                resultPoint = result.startPoint

                const extensionElement = getArcFromExtendedPoint(
                    originalPoint,
                    resultPoint,
                    staticPoint,
                    original.centerPoint
                )
                if (extensionElement) {
                    extensionElements.push(extensionElement)
                }
            }

            if (!isEndSame) {
                staticPoint = original.startPoint
                originalPoint = original.endPoint
                resultPoint = result.endPoint

                const extensionElement = getArcFromExtendedPoint(
                    originalPoint,
                    resultPoint,
                    staticPoint,
                    original.centerPoint
                )
                if (extensionElement) {
                    extensionElements.push(extensionElement)
                }
            }

            return extensionElements
        }
        // eslint-disable-next-line no-fallthrough
        case 'polyline':
        case 'rectangle':
            let extensionElements = getExtensionDifference(original.elements[0], result.elements[0])

            extensionElements = extensionElements.concat(
                getExtensionDifference(
                    original.elements[original.elements.length - 1],
                    result.elements[result.elements.length - 1]
                )
            )

            return extensionElements
        default:
            return null
    }
}

const useExtendCommand = () => {
    const {
        elements: {
            getElementsContainingPoint,
            getElementsInContainer,
            getElementById,
            clearReplacingElements,
            startReplacingElements,
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

            const commandResult = {}
            const retrieveElementExtensionEnds = (element, elementToExtend, extendPoints) => {
                const filteredExtendPoints = elementToExtend.groupId
                    ? extendPoints.filter(ep => elementToExtend.checkIfPointOnElement(ep, SELECT_DELTA))
                    : extendPoints

                const nearestEndPoints = checkIsElementStartCloserThanEnd(
                    element,
                    filteredExtendPoints,
                    elementToExtend.groupId ? elementToExtend : null
                )

                const shouldExtendStart = nearestEndPoints.some(nep => nep)
                const shouldExtendEnd = nearestEndPoints.some(nep => !nep)
                return [shouldExtendStart, shouldExtendEnd]
            }

            const retrieveElementCommandResult = (elementToExtend, shouldExtendStart, shouldExtendEnd) => {
                let newStartPos = null
                let newEndPos = null
                if (shouldExtendStart) {
                    newStartPos = tryExtendElementEnd(elementToExtend, true)
                }

                if (shouldExtendEnd) {
                    newEndPos = tryExtendElementEnd(elementToExtend, false)
                }

                if (newStartPos || newEndPos) {
                    let editedElement = ElementManipulator.copyElement(elementToExtend, { assignId: true })

                    if (newStartPos) {
                        editedElement.startPoint = newStartPos
                    }

                    if (newEndPos) {
                        editedElement.endPoint = newEndPos
                    }

                    editedElement = validateExtendedElement(editedElement)

                    return { replacingElements: [editedElement], removedSections: [elementToExtend] }
                }

                return null
            }

            const filteredElementsToExtendById = {}
            const polylines = {}
            for (const elementToExtend of elementsToExtend) {
                // filter cases where no extension is required
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

                // try to make extension and store result in commandResult
                const element = elementToExtend.groupId ? polylines[elementToExtend.groupId] : elementToExtend

                let extendPoints = null
                if (lastClick) {
                    const selectRect = createElement('rectangle', createPoint(lastClick.x, lastClick.y, { assignId: false }))
                    selectRect.setLastAttribute(mousePoint.x, mousePoint.y)

                    extendPoints = ElementIntersector.getIntersections(element, selectRect)
                } else if (element.checkIfPointOnElement(mousePoint, selectDelta)) {
                    extendPoints = [mousePoint]
                }

                if (!extendPoints) continue

                const [shouldExtendStart, shouldExtendEnd] = retrieveElementExtensionEnds(
                    element,
                    elementToExtend,
                    extendPoints
                )

                if (filteredElementsToExtendById[element.id]) {
                    // this would happen if element is a polyline and we are extending by more than
                    // one subElement
                    filteredElementsToExtendById[element.id].shouldExtendStart =
                        filteredElementsToExtendById[element.id].shouldExtendStart || shouldExtendStart

                    filteredElementsToExtendById[element.id].shouldExtendEnd =
                        filteredElementsToExtendById[element.id].shouldExtendEnd || shouldExtendEnd
                } else {
                    filteredElementsToExtendById[element.id] = {
                        element,
                        shouldExtendStart,
                        shouldExtendEnd
                    }
                }
            }

            const filteredElementsToExtend = Object.values(filteredElementsToExtendById)
            for (const filteredElement of filteredElementsToExtend) {
                const result = retrieveElementCommandResult(
                    filteredElement.element,
                    filteredElement.shouldExtendStart,
                    filteredElement.shouldExtendEnd
                )

                if (result) {
                    const elementId = filteredElement.element.id
                    commandResult[elementId] = result
                    commandResult[elementId].diffElements = getExtensionDifference(
                        result.removedSections[0],
                        result.replacingElements[0]
                    )
                }
            }

            clearReplacingElements(filteredElementsToExtend.map(fe => fe.element))

            // TODO: For trim/extend and possibly other commands: what if first and second click are the same point?

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
            startReplacingElements,
            tryExtendElementEnd,
            tool.isStarted,
            validateExtendedElement
        ]
    )

    return handleExtendCmd
}

export default useExtendCommand
