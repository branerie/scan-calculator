import { useCallback } from 'react'
import Element, { ElementWithId, FullyDefinedElement } from '../../drawingElements/element'
import Point from '../../drawingElements/point'
import { FullyDefinedPolyline, SubElement } from '../../drawingElements/polyline'
import { useElementsStoreContext } from '../../contexts/ElementsStoreContext'
import ElementIntersector from '../../utils/elementIntersector'
import ElementTrimmer from '../../utils/elementTrimmer'
import { copyPoint, pointsMatch } from '../../utils/point'
import { Defined, Ensure } from '../../utils/types/generics'
import UserSelection from '../../utils/userSelection'

const getPointCoordinatesKey = (point: Point) => `${point.x};${point.y}`

const useTrimUtils = () => {
  const useElementsStore = useElementsStoreContext()
  const getElementById = useElementsStore((state) => state.getElementById)
  const getElementsNearElement = useElementsStore((state) => state.getElementsNearElement)
  const selectedElements = useElementsStore((state) => state.selectedElements)
  const hasSelectedElement = useElementsStore((state) => state.hasSelectedElement)

  const getElementTrimPoints = useCallback(
    (elementToTrim: ElementWithId, includeEndPoints = false) => {
      // if (elementToTrim.baseType === 'polyline') {
      //     return elementToTrim.elements.map(se => getElementTrimPoints(se, includeEndPoints))
      // }
      const nearbyElements = getElementsNearElement(elementToTrim, {
        returnGroup: 'individual',
        skipSiblings: true,
      }) as ElementWithId[]

      const checkShouldTrimByElement = (elementToCheck: ElementWithId) =>
        elementToCheck.id !== elementToTrim.id && (!selectedElements || hasSelectedElement(elementToCheck))

      const trimPoints = nearbyElements.reduce<Defined<Point, 'pointId'>[]>((acc, etb) => {
        const shouldTrimByElement = checkShouldTrimByElement(etb)
        if (!shouldTrimByElement) {
          return acc
        }

        let intersections = ElementIntersector.getIntersections(elementToTrim, etb, 'yes')
        if (intersections) {
          const elementStartPoint = elementToTrim.startPoint
          const isInSamePolyline = elementToTrim.groupId && elementToTrim.groupId === etb.groupId

          const finalIntersections: Defined<Point, 'pointId'>[] = []
          const shouldFilterEndPoints = elementStartPoint && (!includeEndPoints || isInSamePolyline)
          for (const intersection of intersections) {
            if (
              shouldFilterEndPoints &&
              (pointsMatch(intersection, elementStartPoint) ||
                pointsMatch(intersection, elementToTrim.endPoint))
            ) {
              // should never include shared points between polyline elements as trim points
              // even if includeEndPoints is true
              continue
            }

            finalIntersections.push(
              copyPoint(intersection, true, !intersection.pointId) as Defined<Point, 'pointId'>
            )
          }

          acc = acc.concat(finalIntersections)
        }

        return acc
      }, [])

      return trimPoints
    },
    [getElementsNearElement, hasSelectedElement, selectedElements]
  )

  /**
   * Returns a record of trim results consisting of replacing elements and removed sections, the results of trimming elementsToTrim
   *
   * @returns {
   *   @param singleElementCmdResult: A collection of trim results (replacing and replaced elements) keyed by original element's id
   *   @param polylineIds: A set of polyline ids made up of al the polylines to be trimmed (used in getPolylineTrimResults)
   * }
   */
  const getSingleElementTrimResults = useCallback(
    (elementsToTrim: ElementWithId[], pointsOfSelection: Point[]) => {
      const commandResult: Map<
        string,
        { replacingElements: ElementWithId[]; removedSections: FullyDefinedElement[] }
      > = new Map()
      const polylineIds: Set<string> = new Set()
      for (const elementToTrim of elementsToTrim) {
        if (elementToTrim.groupId) {
          // we do not deal with polyline sub-elements in this function, but their parent polylines are returned
          // and should be handled separately
          polylineIds.add(elementToTrim.groupId)
          continue
        }
        // if (elementToTrim.groupId) {
        //     const polylineId = elementToTrim.groupId

        //     if (!polylines[polylineId]) {
        //         polylines[polylineId] = {}
        //     }

        //     continue
        // }

        const pointsOfTrim = getElementTrimPoints(elementToTrim, false)
        if (pointsOfTrim.length === 0) {
          continue
        }

        const resultElements = ElementTrimmer.trimElement(elementToTrim, pointsOfTrim, pointsOfSelection)

        if (resultElements) {
          commandResult.set(elementToTrim.id, {
            replacingElements: resultElements.remaining,
            removedSections: resultElements.removed,
          })
        }
      }

      // return { singleElementCmdResult: commandResult, polylines }
      return { singleElementCmdResult: commandResult, polylineIds }
    },
    [getElementTrimPoints]
  )

  const getPolylineTrimResults = useCallback(
    (polylineIds: Set<string>, pointsOfSelection: Point[]) => {
      // /**
      //  * Filters out repeating trim points which occur at subElement join points
      //  */
      // const filterTrimPoints = (
      //   trimPointsBySubElementId: Record<string, Defined<Point, 'pointId'>[]>,
      //   currentSubElementTrimPoints: Point[],
      //   elementsByTrimPoint: Record<string, Set<string>>,
      //   selectedSubElementIds: Set<string>
      // ) => {
      //   const newTrimPointsBySubElementId = { ...trimPointsBySubElementId }

      //   // here, an element is called "selected" if there is a pointOfSelection on it
      //   // or the selection box crosses it
      //   for (const suTrimPoint of currentSubElementTrimPoints) {
      //     const pointKey = getPointCoordinatesKey(suTrimPoint)

      //     const selectedSuIdsWithPoint = Array.from(elementsByTrimPoint[pointKey]).filter((subElementId) =>
      //       selectedSubElementIds.has(subElementId)
      //     )

      //     for (const selectedSuId of selectedSuIdsWithPoint) {
      //       newTrimPointsBySubElementId[selectedSuId] = newTrimPointsBySubElementId[selectedSuId].filter(
      //         (p) => p.x !== suTrimPoint.x && p.y !== suTrimPoint.y
      //       )
      //     }
      //   }

      //   return newTrimPointsBySubElementId
      // }

      const commandResult: Map<string, { replacingElements: ElementWithId[]; removedSections: Element[] }> =
        new Map()
      if (polylineIds.size === 0) {
        return commandResult
      }

      const userSelection = new UserSelection(pointsOfSelection)
      // for (const polylineId of Object.keys(polylines)) {
      for (const polylineId of polylineIds) {
        const elementToTrim = getElementById(polylineId)! as Ensure<FullyDefinedPolyline, 'id'>

        const elementIdsByTrimPoint: Record<string, Set<string>> = {}
        // const selectedSubElementIds = new Set<string>()
        const subElements = elementToTrim.elements as Ensure<SubElement, 'id'>[]
        let hasAnyTrimPoints = false
        let trimPointsBySubElementId: Record<string, Defined<Point, 'pointId'>[]> = {}
        /**
         * Loops through all subElements except first and last
         */
        for (let subElementIndex = 1; subElementIndex < subElements.length - 1; subElementIndex++) {
          const subElement = subElements[subElementIndex] as ElementWithId
          // if (userSelection.isElementSelected(subElement, 'crossing')) {
          //   selectedSubElementIds.add(subElement.id)
          // }
          /**
           * TODO:
           * 1. Do we need to continue in loop if subElement has no selection points?
           * 2. Do we need to includeEndPoints in getElementTrimPoints here?
           */
          const newTrimPoints = getElementTrimPoints(subElement, true)
          trimPointsBySubElementId[subElement.id] = newTrimPoints

          for (const trimPoint of newTrimPoints) {
            const pointKey = getPointCoordinatesKey(trimPoint)
            if (!elementIdsByTrimPoint[pointKey]) {
              elementIdsByTrimPoint[pointKey] = new Set()
            }

            elementIdsByTrimPoint[pointKey].add(subElement.id)
          }

          // trimPointsBySubElementId = filterTrimPoints(
          //   trimPointsBySubElementId,
          //   newTrimPoints,
          //   elementIdsByTrimPoint,
          //   selectedSubElementIds
          // )

          hasAnyTrimPoints = hasAnyTrimPoints || newTrimPoints.length > 0
        }

        const polylineStartPoint = elementToTrim.startPoint
        const polylineEndPoint = elementToTrim.endPoint

        const firstSubElement = subElements[0]
        const firstElementTrimPoints = getElementTrimPoints(firstSubElement, true)
        // trimPointsBySubElementId[firstSubElement.id] = firstElementTrimPoints
        trimPointsBySubElementId[firstSubElement.id] = firstElementTrimPoints.filter(
          (tp) => !pointsMatch(tp, polylineStartPoint)
        )

        hasAnyTrimPoints = hasAnyTrimPoints || trimPointsBySubElementId[firstSubElement.id].length > 0

        const lastSubElement = subElements[subElements.length - 1]
        const lastElementTrimPoints = getElementTrimPoints(lastSubElement, true)
        // trimPointsBySubElementId[lastSubElement.id] = lastElementTrimPoints
        trimPointsBySubElementId[lastSubElement.id] = lastElementTrimPoints.filter(
          (tp) => !pointsMatch(tp, polylineEndPoint)
        )

        hasAnyTrimPoints = hasAnyTrimPoints || trimPointsBySubElementId[lastSubElement.id].length > 0

        if (!hasAnyTrimPoints) {
          return commandResult
        }

        const resultElements = ElementTrimmer.trimPolyline(
          elementToTrim,
          trimPointsBySubElementId,
          pointsOfSelection
        )

        if (resultElements) {
          for (let replacingIndex = 0; replacingIndex < resultElements.remaining.length; replacingIndex++) {
            // ElementTrimmer.trimPolyline only returns polylines in remaining, but they might only consist
            // of a single element, so we only include that in the results
            const replacingPolyline = resultElements.remaining[replacingIndex] as FullyDefinedPolyline
            if (replacingPolyline.elements.length === 1) {
              resultElements.remaining[replacingIndex] = replacingPolyline.elements[0] as Ensure<
                FullyDefinedElement,
                'id'
              >
              resultElements.remaining[replacingIndex].groupId = null
            }
          }

          commandResult.set(elementToTrim.id, {
            replacingElements: resultElements.remaining,
            removedSections: resultElements.removed,
          })
        }
      }

      return commandResult
    },
    [getElementById, getElementTrimPoints]
  )

  return {
    getSingleElementTrimResults,
    getPolylineTrimResults,
  }
}

export default useTrimUtils
