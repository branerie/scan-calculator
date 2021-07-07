import { useCallback } from "react"
import { useElementsContext } from "../../contexts/ElementsContext"
import ElementIntersector from "../../utils/elementIntersector"
import ElementTrimmer from "../../utils/elementTrimmer"
import { pointsMatch } from "../../utils/point"

const useTrimUtils = () => {
    const {
        elements: {
            getElementById
        },
        selection: {
            selectedElements
        }
    } = useElementsContext()

    const getElementTrimPoints = useCallback((elementToTrim, includeEndPoints = false) => {
        return selectedElements.reduce((acc, cse) => {
            let intersections = ElementIntersector.getIntersections(elementToTrim, cse)
            if (intersections) {
                const elementStartPoint = elementToTrim.startPoint
                if (elementStartPoint && !includeEndPoints) {
                    intersections = intersections.filter(int =>
                        !pointsMatch(int, elementStartPoint) && !pointsMatch(int, elementToTrim.endPoint))
                }

                return [...acc, ...intersections]
            }

            return acc
        }, [])
    }, [selectedElements])

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

            hasAnyTrimPoints = hasAnyTrimPoints || firstElementTrimPoints.length > 0
            
            const lastSubElement = subElements[subElements.length - 1]
            const lastElementTrimPoints = getElementTrimPoints(lastSubElement)
            trimPoints[lastSubElement.id] = lastElementTrimPoints.filter(tp =>
                !pointsMatch(tp, polylineStartPoint) && !pointsMatch(tp, polylineEndPoint))

            hasAnyTrimPoints = hasAnyTrimPoints || lastElementTrimPoints.length > 0

            if (!hasAnyTrimPoints) {
                return commandResult
            }

            const resultElements = ElementTrimmer.trimElement(elementToTrim, trimPoints, pointsOfSelection)
            if (resultElements) {
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