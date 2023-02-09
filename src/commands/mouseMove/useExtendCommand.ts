import { useCallback } from 'react'
import { useElementsStoreContext } from '../../contexts/ElementsStoreContext'
import Arc, { FullyDefinedArc } from '../../drawingElements/arc'
import Circle from '../../drawingElements/circle'
import Element, { ElementWithId, FullyDefinedElement } from '../../drawingElements/element'
import Line from '../../drawingElements/line'
import Point from '../../drawingElements/point'
import Polyline, { FullyDefinedPolyline, SubElement } from '../../drawingElements/polyline'
import { FullyDefinedRectangle } from '../../drawingElements/rectangle'
import useExtendUtils from '../../hooks/utility/useExtendUtils'
import { useToolsStore } from '../../stores/tools/index'
import { SELECT_DELTA } from '../../utils/constants'
import { checkIsElementStartCloserThanEnd } from '../../utils/element'
import { createArc, createElementFromName, createLine, createPoint } from '../../utils/elementFactory'
import ElementIntersector from '../../utils/elementIntersector'
import ElementManipulator from '../../utils/elementManipulator'
import { pointsMatch } from '../../utils/point'
import { Ensure } from '../../utils/types/generics'
import { MousePosition } from '../../utils/types/index'

const getArcFromExtendedPoint = (original: Point, result: Point, stationary: Point, center: Point) => {
  const extensionArc = createArc(center, original, result)
  if (extensionArc.checkIfPointOnElement(stationary)) {
    // extension arc should not contain the other point of the arc
    extensionArc.startPoint = result
    extensionArc.endPoint = original
  }

  return extensionArc
}

const getExtensionDifference = <T extends Element>(
  original: Ensure<T, 'startPoint' | 'endPoint'>,
  result: Ensure<T, 'startPoint' | 'endPoint'>
): FullyDefinedElement[] | null => {
  if (original.baseType !== result.baseType) {
    return null
  }

  if (original instanceof Line) {
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
  } else if (original instanceof Arc) {
    const isCenterSame = pointsMatch(original.centerPoint, (result as unknown as FullyDefinedArc).centerPoint)
    if (!isCenterSame) {
      return null
    }

    if (result instanceof Circle) {
      // the arc has been closed, extension difference is just the original arc
      // with start and end points switched
      const extensionArc = ElementManipulator.copyArc(original, false, false) as FullyDefinedArc
      extensionArc.startPoint = original.endPoint
      extensionArc.endPoint = original.startPoint
      return [extensionArc]
    }

    const isStartSame = pointsMatch(original.startPoint, result.startPoint)
    const isEndSame = pointsMatch(original.endPoint, result.endPoint)

    const extensionElements: FullyDefinedArc[] = []
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
  } else if (original instanceof Polyline) {
    let extensionElements = getExtensionDifference(
      original.elements[0],
      (result as FullyDefinedPolyline).elements[0]
    )!

    extensionElements = extensionElements.concat(
      getExtensionDifference(
        original.elements[original.elements.length - 1],
        (result as FullyDefinedPolyline).elements[(result as FullyDefinedPolyline).elements.length - 1]
      )!
    )

    return extensionElements
  } else {
    return null
  }
}

const useExtendCommand = () => {
  const useElementsStore = useElementsStoreContext()
  const getElementsContainingPoint = useElementsStore((state) => state.getElementsContainingPoint)
  const getElementsInContainer = useElementsStore((state) => state.getElementsInContainer)
  const getElementById = useElementsStore((state) => state.getElementById)
  const clearReplacingElements = useElementsStore((state) => state.clearReplacingElements)
  const startReplacingElements = useElementsStore((state) => state.startReplacingElements)
  const hasSelectedElement = useElementsStore((state) => state.hasSelectedElement)

  const tool = useToolsStore((state) => state.tool)
  const addToolProp = useToolsStore((state) => state.addToolProp)
  const getLastReferenceClick = useToolsStore((state) => state.getLastReferenceClick)
  const getSelectDelta = useToolsStore((state) => state.getSelectDelta)

  const { tryExtendElementEnd, validateExtendedElement } = useExtendUtils()

  const handleExtendCmd = useCallback(
    (mousePosition: MousePosition) => {
      if (!tool.isStarted) {
        return
      }

      const { mouseX, mouseY } = mousePosition
      const lastClick = getLastReferenceClick()
      if (lastClick) {
        addToolProp({ mousePosition })
      }

      const mousePoint = { x: Number(mouseX.toFixed(3)), y: Number(mouseY.toFixed(3)) }

      const selectDelta = getSelectDelta()
      let elementsToExtend = lastClick
        ? (getElementsInContainer(lastClick, mousePoint, {
            shouldSkipPartial: false,
            returnGroup: 'individual',
          }) as ElementWithId[] | null)
        : (getElementsContainingPoint(mouseX, mouseY, {
            maxPointsDiff: selectDelta,
            returnGroup: 'individual',
          }) as ElementWithId[] | null)

      if (!elementsToExtend) {
        return clearReplacingElements()
      }

      const retrieveElementExtensionEnds = (
        element: FullyDefinedElement,
        elementToExtend: FullyDefinedElement,
        extendPoints: Point[]
      ) => {
        const filteredExtendPoints = elementToExtend.groupId
          ? extendPoints.filter((ep) => elementToExtend.checkIfPointOnElement(ep, SELECT_DELTA))
          : extendPoints

        const nearestEndPoints = checkIsElementStartCloserThanEnd(
          element,
          filteredExtendPoints,
          elementToExtend.groupId ? (elementToExtend as SubElement) : undefined
        )

        const shouldExtendStart = nearestEndPoints.some((nep) => nep)
        const shouldExtendEnd = nearestEndPoints.some((nep) => !nep)
        return [shouldExtendStart, shouldExtendEnd]
      }

      const retrieveElementCommandResult = (
        elementToExtend: FullyDefinedElement,
        shouldExtendStart: boolean,
        shouldExtendEnd: boolean
      ) => {
        let newStartPos = null
        let newEndPos = null
        if (shouldExtendStart) {
          newStartPos = tryExtendElementEnd(elementToExtend, true)
        }

        if (shouldExtendEnd) {
          newEndPos = tryExtendElementEnd(elementToExtend, false)
        }

        if (newStartPos || newEndPos) {
          let editedElement = ElementManipulator.copyElement(elementToExtend, {
            assignId: true,
          }) as FullyDefinedElement

          if (newStartPos) {
            editedElement.startPoint = newStartPos
          }

          if (newEndPos) {
            editedElement.endPoint = newEndPos
          }

          editedElement = validateExtendedElement(editedElement)

          return { replacingElements: [editedElement as ElementWithId], removedSections: [elementToExtend] }
        }

        return null
      }

      const filteredElementsToExtendById: Record<
        string,
        {
          element: ElementWithId
          shouldExtendStart: boolean
          shouldExtendEnd: boolean
        }
      > = {}
      const polylines: Record<string, ElementWithId> = {}
      for (const elementToExtend of elementsToExtend) {
        // filter cases where no extension is required
        if (hasSelectedElement(elementToExtend) || elementToExtend.type === 'circle') {
          continue
        }

        if (elementToExtend.groupId) {
          // will not be polyline, need to move condition
          const polyline = getElementById(elementToExtend.groupId)! as Ensure<FullyDefinedPolyline, 'id'>
          polylines[polyline.id] = polyline

          if (polyline.isJoined || hasSelectedElement(polyline)) {
            continue
          }
        }

        // try to make extension and store result in commandResult
        const element = elementToExtend.groupId ? polylines[elementToExtend.groupId] : elementToExtend

        let extendPoints: Point[] | null = null
        if (lastClick) {
          const selectRect = createElementFromName(
            'rectangle',
            createPoint(lastClick.x, lastClick.y, { assignId: false })
          )
          selectRect.setLastAttribute(mousePoint.x, mousePoint.y)

          extendPoints = ElementIntersector.getIntersections(element, selectRect as FullyDefinedRectangle, 'yes')
        } else if (element.checkIfPointOnElement(mousePoint, selectDelta)) {
          extendPoints = [mousePoint]
        }

        if (!extendPoints) {
          continue
        }

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
            shouldExtendEnd,
          }
        }
      }

      const commandResult: Map<
        string,
        {
          replacingElements: ElementWithId[]
          removedSections: FullyDefinedElement[]
          diffElements: FullyDefinedElement[]
        }
      > = new Map()
      const filteredElementsToExtend = Object.values(filteredElementsToExtendById)
      for (const filteredElement of filteredElementsToExtend) {
        const result = retrieveElementCommandResult(
          filteredElement.element,
          filteredElement.shouldExtendStart,
          filteredElement.shouldExtendEnd
        )

        if (result) {
          const elementId = filteredElement.element.id
          commandResult.set(elementId, {
            ...result,
            diffElements: getExtensionDifference(result.removedSections[0], result.replacingElements[0])!,
          })
        }
      }

      clearReplacingElements(filteredElementsToExtend.map((fe) => fe.element))

      // TODO: For trim/extend and possibly other commands: what if first and second click are the same point?

      if (commandResult.size > 0) {
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
      getSelectDelta,
      clearReplacingElements,
      startReplacingElements,
      tryExtendElementEnd,
      tool.isStarted,
      validateExtendedElement,
    ]
  )

  return handleExtendCmd
}

export default useExtendCommand
