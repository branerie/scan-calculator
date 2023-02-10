import { useCallback } from 'react'
import { useElementContainerContext } from '../contexts/ElementContainerContext'
import { useElementsStoreContext } from '../contexts/ElementsStoreContext'
import { FullyDefinedArc } from '../drawingElements/arc'
import { FullyDefinedElement } from '../drawingElements/element'
import { FullyDefinedLine } from '../drawingElements/line'
import { DivContentsYieldResult } from '../utils/elementContainers/elementContainer'
import { findClosestIntersectPoint } from '../utils/intersections'

export default function useIntersections() {
  const useElementsStore = useElementsStoreContext()
  const getElementById = useElementsStore((state) => state.getElementById)
  const hasSelectedElement = useElementsStore((state) => state.hasSelectedElement)
  const selectedElements = useElementsStore((state) => state.selectedElements)

  const container = useElementContainerContext()

  const getNextElementIntersection = useCallback(
    (
      element: FullyDefinedElement,
      nextElementsGen: Generator<DivContentsYieldResult, null, unknown>,
      options: {
        shouldExtendFromStart: boolean
        shouldCheckPointsLocality: boolean
      }
    ) => {
      const { shouldExtendFromStart, shouldCheckPointsLocality } = options

      for (const nextResults of nextElementsGen) {
        if (!nextResults || nextResults.divContents.size === 0) {
          continue
        }

        const { divContents: nearbyElementIds, checkIfPointInSameDiv } = nextResults

        const filteredNearbyElements = []
        for (const nearbyElementId of nearbyElementIds) {
          if (nearbyElementId === element.id) {
            continue
          }

          const nearbyElement = getElementById(nearbyElementId)!
          if (selectedElements && !hasSelectedElement(nearbyElement)) {
            continue
          }

          filteredNearbyElements.push(nearbyElement)
        }

        const nextIntersectPoint = findClosestIntersectPoint(element, filteredNearbyElements, {
          fromStart: shouldExtendFromStart,
          checkIntersectionLocality: shouldCheckPointsLocality
            ? container.checkPointsLocality.bind(container)
            : null,
          excludeExistingIntersections: true,
        })

        if (!nextIntersectPoint || !checkIfPointInSameDiv(nextIntersectPoint)) {
          continue
        }

        return nextIntersectPoint
      }

      return null
    },
    [container, getElementById, hasSelectedElement, selectedElements]
  )

  const getNextLineIntersection = useCallback(
    (
      line: FullyDefinedLine,
      options: {
        shouldExtendFromStart: boolean
        shouldCheckPointsLocality: boolean
      }
    ) => {
      const { shouldExtendFromStart, shouldCheckPointsLocality } = options
      const nextElementsGen = container.getNextElementsInLineDirection(line, shouldExtendFromStart)

      return getNextElementIntersection(line, nextElementsGen, {
        shouldExtendFromStart,
        shouldCheckPointsLocality,
      })
    },
    [container, getNextElementIntersection]
  )

  const getNextArcIntersection = useCallback(
    (
      arc: FullyDefinedArc,
      options: {
        shouldExtendFromStart: boolean
        shouldCheckPointsLocality: boolean
      }
    ) => {
      const { shouldExtendFromStart, shouldCheckPointsLocality } = options
      const nextElementsGen = container.getNextElementsInArcDirection(arc, shouldExtendFromStart)

      return getNextElementIntersection(arc, nextElementsGen, {
        shouldExtendFromStart,
        shouldCheckPointsLocality,
      })
    },
    [container, getNextElementIntersection]
  )

  return {
    getNextLineIntersection,
    getNextArcIntersection,
  }
}
