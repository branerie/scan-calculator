import { useCallback } from "react"
import { useElementsContext } from "../../contexts/ElementsContext"
import ElementIntersector from "../../utils/elementIntersector"
import ElementTrimmer from "../../utils/elementTrimmer"
import { pointsMatch } from "../../utils/point"

const useTrimUtils = () => {
    const {
        elements: {
            getElementById,
            getElementsInContainer
        },
        selection: {
            selectedElements,
            hasSelectedElement
        }
    } = useElementsContext()

    const getElementTrimPoints = useCallback((elementToTrim, includeEndPoints = false) => {
        const elementBoundingBox = elementToTrim.getBoundingBox()
        const elementsInContainer = getElementsInContainer(
            { x: elementBoundingBox.left, y: elementBoundingBox.top  },
            { x: elementBoundingBox.right, y: elementBoundingBox.bottom  },
            false,
            false
        )

        const elementsToTrimBy = elementsInContainer.filter(
            eic => eic.id !== elementToTrim.id && 
            ((selectedElements && hasSelectedElement(eic)) || !selectedElements)
        )

        const trimPoints = elementsToTrimBy.reduce((acc, etb) => {
            let intersections = ElementIntersector.getIntersections(elementToTrim, etb)
            if (intersections) {
                const elementStartPoint = elementToTrim.startPoint
                const isInSamePolyline = elementToTrim.groupId && elementToTrim.groupId === etb.groupId
                // should never include shared points between polyline elements as trim points
                // even if includeEndPoints is true
                if (elementStartPoint && (!includeEndPoints || isInSamePolyline)) {
                    intersections = intersections.filter(int =>
                        !pointsMatch(int, elementStartPoint) && !pointsMatch(int, elementToTrim.endPoint))
                }

                return [...acc, ...intersections]
            }

            return acc
        }, [])

        return trimPoints
    }, [getElementsInContainer, hasSelectedElement, selectedElements])

    const getSingleElementTrimResults = useCallback((elementsToTrim, pointsOfSelection) => {
        const commandResult = {}
        const polylines = {}
        for (const elementToTrim of elementsToTrim) {
            if (elementToTrim.groupId) {
                const polylineId = elementToTrim.groupId

                if (!polylines[polylineId]) {
                    polylines[polylineId] = {}
                }

                continue
            }

            const pointsOfTrim = getElementTrimPoints(elementToTrim, elementToTrim.groupId)
            if (pointsOfTrim.length === 0) continue

            const resultElements = ElementTrimmer.trimElement(elementToTrim, pointsOfTrim, pointsOfSelection)
            if (resultElements) {
                commandResult[elementToTrim.id] = {
                    replacingElements: resultElements.remaining,
                    removedSections: resultElements.removed
                }
            }
        }

        return { singleElementCmdResult: commandResult, polylines }
    }, [getElementTrimPoints])

    const getPolylineTrimResults = useCallback((polylines, pointsOfSelection) => {
        const commandResult = {}

        for (const [polylineId, trimPoints] of Object.entries(polylines)) {
            const elementToTrim = getElementById(polylineId)
            const polylineStartPoint = elementToTrim.startPoint
            const polylineEndPoint = elementToTrim.endPoint

            const subElements = elementToTrim.elements
            let hasAnyTrimPoints = false
            for (let subElementIndex = 1; subElementIndex < subElements.length - 1; subElementIndex++) {
                const subElement = subElements[subElementIndex]
                const newTrimPoints = getElementTrimPoints(subElement, true)
                trimPoints[subElement.id] = newTrimPoints
                hasAnyTrimPoints = hasAnyTrimPoints || newTrimPoints.length > 0
            }

            const firstSubElement = subElements[0]
            const firstElementTrimPoints = getElementTrimPoints(firstSubElement)
            trimPoints[firstSubElement.id] = firstElementTrimPoints.filter(tp =>
                !pointsMatch(tp, polylineStartPoint) && !pointsMatch(tp, polylineEndPoint))

            hasAnyTrimPoints = hasAnyTrimPoints || trimPoints[firstSubElement.id].length > 0
            
            const lastSubElement = subElements[subElements.length - 1]
            const lastElementTrimPoints = getElementTrimPoints(lastSubElement)
            trimPoints[lastSubElement.id] = lastElementTrimPoints.filter(tp =>
                !pointsMatch(tp, polylineStartPoint) && !pointsMatch(tp, polylineEndPoint))

            hasAnyTrimPoints = hasAnyTrimPoints || trimPoints[lastSubElement.id].length > 0

            if (!hasAnyTrimPoints) {
                return commandResult
            }

            const resultElements = ElementTrimmer.trimElement(elementToTrim, trimPoints, pointsOfSelection)
            if (resultElements) {
                for (let replacingIndex = 0; replacingIndex < resultElements.remaining.length; replacingIndex++) {
                    const replacingPolyline = resultElements.remaining[replacingIndex]
                    if (replacingPolyline.elements.length === 1) {
                        resultElements.remaining[replacingIndex] = replacingPolyline.elements[0]
                        resultElements.remaining[replacingIndex].groupId = null
                    } 
                }

                commandResult[elementToTrim.id] = {
                    replacingElements: resultElements.remaining,
                    removedSections: resultElements.removed
                }
            }
        }

        return commandResult
    }, [getElementById, getElementTrimPoints])

    return {
        getSingleElementTrimResults,
        getPolylineTrimResults
    }
}

export default useTrimUtils