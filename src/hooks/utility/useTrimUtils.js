import { useCallback } from 'react'
import { useAppContext } from '../../contexts/AppContext'
import ElementIntersector from '../../utils/elementIntersector'
import ElementTrimmer from '../../utils/elementTrimmer'
import { pointsMatch } from '../../utils/point'

const getPointCoordinatesKey = point => `${point.x};${point.y}`

const useTrimUtils = () => {
    const {
        elements: {
            getElementById,
            getElementsNearElement,
            selection: { selectedElements, hasSelectedElement }
        }
    } = useAppContext()

    const getElementTrimPoints = useCallback(
        (elementToTrim, includeEndPoints = false) => {
            // if (elementToTrim.baseType === 'polyline') {
            //     return elementToTrim.elements.map(se => getElementTrimPoints(se, includeEndPoints))
            // }
            debugger
            const nearbyElements = getElementsNearElement(elementToTrim, {
                returnGroup: 0,
                skipSiblings: false
            })
            debugger
            const checkShouldTrimByElement = elementToCheck => {
                return (
                    elementToCheck.id !== elementToTrim.id &&
                    (!selectedElements || hasSelectedElement(elementToCheck))
                )
            }

            const trimPoints = nearbyElements.reduce((acc, etb) => {
                const shouldTrimByElement = checkShouldTrimByElement(etb)
                if (!shouldTrimByElement) {
                    return acc
                }

                let intersections = ElementIntersector.getIntersections(elementToTrim, etb, 'yes')
                if (intersections) {
                    const elementStartPoint = elementToTrim.startPoint
                    const isInSamePolyline = elementToTrim.groupId && elementToTrim.groupId === etb.groupId
                    // should never include shared points between polyline elements as trim points
                    // even if includeEndPoints is true
                    if (elementStartPoint && (!includeEndPoints || isInSamePolyline)) {
                        intersections = intersections.filter(
                            intersection =>
                                !pointsMatch(intersection, elementStartPoint) &&
                                !pointsMatch(intersection, elementToTrim.endPoint)
                        )
                    }

                    return [...acc, ...intersections]
                }

                return acc
            }, [])

            return trimPoints
        },
        [getElementsNearElement, hasSelectedElement, selectedElements]
    )

    const getSingleElementTrimResults = useCallback(
        (elementsToTrim, pointsOfSelection) => {
            const commandResult = {}
            const polylines = {}
            for (const elementToTrim of elementsToTrim) {
                if (elementToTrim.baseType === 'polyline') {
                    polylines[elementToTrim.id] = {}
                    continue
                }
                // if (elementToTrim.groupId) {
                //     const polylineId = elementToTrim.groupId

                //     if (!polylines[polylineId]) {
                //         polylines[polylineId] = {}
                //     }

                //     continue
                // }

                const pointsOfTrim = getElementTrimPoints(elementToTrim, !!elementToTrim.groupId)
                if (pointsOfTrim.length === 0) continue

                const resultElements = ElementTrimmer.trimElement(
                    elementToTrim,
                    pointsOfTrim,
                    pointsOfSelection
                )

                if (resultElements) {
                    commandResult[elementToTrim.id] = {
                        replacingElements: resultElements.remaining,
                        removedSections: resultElements.removed
                    }
                }
            }

            return { singleElementCmdResult: commandResult, polylines }
        },
        [getElementTrimPoints]
    )

    const getPolylineTrimResults = useCallback(
        (polylines, pointsOfSelection) => {
            const commandResult = {}

            const filterTrimPoints = (
                trimPointsBySubElementId,
                currentSubElementTrimPoints,
                elementsByTrimPoint,
                selectedSubElementIds
            ) => {
                const newTrimPointsBySubElementId = { ...trimPointsBySubElementId }

                // here, an element is called "selected" if there is a pointOfSelection on it
                // or the selection box crosses it
                for (const suTrimPoint of currentSubElementTrimPoints) {
                    const pointKey = getPointCoordinatesKey(suTrimPoint)
                    const selectedSuIdsWithPoint = elementsByTrimPoint[pointKey].filter(subElementId =>
                        selectedSubElementIds.has(subElementId)
                    )
                    for (const selectedSuId of selectedSuIdsWithPoint) {
                        newTrimPointsBySubElementId[selectedSuId] = newTrimPointsBySubElementId[
                            selectedSuId
                        ].filter(p => p.x !== suTrimPoint.x && p.y !== suTrimPoint.y)
                    }
                }

                return newTrimPointsBySubElementId
            }

            for (const polylineId of Object.keys(polylines)) {
                let trimPointsBySubElementId = polylines[polylineId]

                const elementsByTrimPoint = {}
                const selectedSubElementIds = new Set()
                const elementToTrim = getElementById(polylineId)
                // const polylineStartPoint = elementToTrim.startPoint
                // const polylineEndPoint = elementToTrim.endPoint

                const subElements = elementToTrim.elements
                let hasAnyTrimPoints = false
                for (let subElementIndex = 1; subElementIndex < subElements.length - 1; subElementIndex++) {
                    const subElement = subElements[subElementIndex]
                    if (pointsOfSelection.some(p => subElement.checkIfPointOnElement(p))) {
                        // TODO: what if selection is a box? need to check if box crosses element
                        selectedSubElementIds.add(subElement.id)
                    }

                    const newTrimPoints = getElementTrimPoints(subElement, true)
                    trimPointsBySubElementId[subElement.id] = newTrimPoints

                    for (const trimPoint of newTrimPoints) {
                        const pointKey = getPointCoordinatesKey(trimPoint)
                        if (!elementsByTrimPoint[pointKey]) {
                            elementsByTrimPoint[pointKey] = []
                        }

                        elementsByTrimPoint[pointKey].push(subElement)
                    }

                    trimPointsBySubElementId = filterTrimPoints(
                        trimPointsBySubElementId,
                        newTrimPoints,
                        elementsByTrimPoint,
                        selectedSubElementIds
                    )

                    polylines[polylineId] = trimPointsBySubElementId

                    hasAnyTrimPoints = hasAnyTrimPoints || newTrimPoints.length > 0
                }

                const firstSubElement = subElements[0]
                const firstElementTrimPoints = getElementTrimPoints(firstSubElement, false)
                trimPointsBySubElementId[firstSubElement.id] = firstElementTrimPoints
                // trimPointsBySubElementId[firstSubElement.id] = firstElementTrimPoints.filter(
                //     tp => !pointsMatch(tp, polylineStartPoint) && !pointsMatch(tp, polylineEndPoint)
                // )

                hasAnyTrimPoints = hasAnyTrimPoints || trimPointsBySubElementId[firstSubElement.id].length > 0

                const lastSubElement = subElements[subElements.length - 1]
                const lastElementTrimPoints = getElementTrimPoints(lastSubElement, false)
                trimPointsBySubElementId[lastSubElement.id] = lastElementTrimPoints
                // trimPointsBySubElementId[lastSubElement.id] = lastElementTrimPoints.filter(
                //     tp => !pointsMatch(tp, polylineStartPoint) && !pointsMatch(tp, polylineEndPoint)
                // )

                hasAnyTrimPoints = hasAnyTrimPoints || trimPointsBySubElementId[lastSubElement.id].length > 0

                if (!hasAnyTrimPoints) {
                    return commandResult
                }

                const resultElements = ElementTrimmer.trimElement(
                    elementToTrim,
                    trimPointsBySubElementId,
                    pointsOfSelection
                )
                if (resultElements) {
                    for (
                        let replacingIndex = 0;
                        replacingIndex < resultElements.remaining.length;
                        replacingIndex++
                    ) {
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
        },
        [getElementById, getElementTrimPoints]
    )

    return {
        getSingleElementTrimResults,
        getPolylineTrimResults
    }
}

export default useTrimUtils
