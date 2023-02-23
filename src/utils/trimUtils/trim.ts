import produce from 'immer'
import { FullyDefinedArc } from '../../drawingElements/arc'
import Circle from '../../drawingElements/circle'
import { ElementWithId, FullyDefinedElement } from '../../drawingElements/element'
import Point from '../../drawingElements/point'
import { FullyDefinedPolyline, SubElement } from '../../drawingElements/polyline'
import Rectangle, { FullyDefinedRectangle } from '../../drawingElements/rectangle'
import { getAngleBetweenPoints } from '../angle'
import { createElement, createElementFromName, createLine, createPoint } from '../elementFactory'
import ElementIntersector from '../elementIntersector'
import { isDiffSignificant } from '../number'
import { copyPoint, getPointDistance, pointsMatch } from '../point'
import PriorityQueue from '../priorityQueue'
import { Defined, Ensure } from '../types/generics'
import {
  getSectionKey,
  getSectionKeyStart,
  getSelectionPointDistances,
  getSubsectionElementsInfo,
  PolylnePointDistance,
  splitIntoRemainingRemovedSections,
  trimSubsectionElements,
} from './trimHelper'

type PointDistancesAndSubsections = {
  pointDistances: {
    selection: PolylnePointDistance[]
    points: Record<string, number>
  }
  subsections: Record<string, PolylineTrimSubsectionElementInfo[]>
}

type LineElementDistFuncParams = { startPoint: Point }
type ArcElementDistFuncParams = { centerPoint: Point; startAngle: number, radius: number, flipAngle?: boolean }

/**
 * Joins subsections if the first subsection's startPoint coincides with the
 * last subsection's endPoint
 * @param trimSections sections of element, split by trim points
 * @param element - parent element of trim subsections
 * @param assignId - whether to assign a new id to the potential new, joined section
 */
function joinTrimEndSubsections(
  trimSections: FullyDefinedElement[],
  element: FullyDefinedElement,
  assignId: true
): ElementWithId[]
function joinTrimEndSubsections(
  trimSections: FullyDefinedElement[],
  element: FullyDefinedElement,
  assignId: false
): FullyDefinedElement[]
function joinTrimEndSubsections(
  trimSections: FullyDefinedElement[],
  element: FullyDefinedElement,
  assignId: boolean = true
) {
  if (trimSections?.length < 2) {
    return trimSections
  }

  let editedSections = trimSections
  const firstSection = editedSections[0]
  const lastSection = editedSections[editedSections.length - 1]

  if (pointsMatch(firstSection.startPoint, lastSection.endPoint)) {
    editedSections = editedSections.slice(1, editedSections.length - 1)
    const joinedSection = createSubsection(element, lastSection.startPoint, firstSection.endPoint, assignId)

    editedSections.push(joinedSection)
  }

  return editedSections
}

const trimWithSingleClick = (
  element: ElementWithId,
  selectPointDistanceFromStart: number,
  startPoint: Point,
  endPoint: Point,
  trimPointsQueue: PriorityQueue<TrimPointElementDistances>,
  subsections?: Record<string, PolylineTrimSubsectionElementInfo[]>
): {
  remaining: Ensure<FullyDefinedElement, 'id'>[]
  removed: FullyDefinedElement[]
} => {
  if (trimPointsQueue.size === 0) {
    return {
      remaining: [element],
      removed: [],
    }
  }

  let { point: trimSectionStartPoint, distanceFromStart: trimSectionDistance } = trimPointsQueue.pop()!
  if (selectPointDistanceFromStart < trimSectionDistance) {
    // if | designates start of element, || end of element and x - intersections with elements we are trimming by:
    // |----<trimmedSection>---x---x---...---||
    const remainingSection = createSubsection(element, trimSectionStartPoint, endPoint, true, subsections)
    const removedSection = createSubsection(element, startPoint, trimSectionStartPoint, false, subsections)
    return { remaining: [remainingSection], removed: [removedSection] }
  }

  const nextValue = trimPointsQueue.peek()
  let trimSectionEndPoint: Point = nextValue ? nextValue.point : endPoint
  while (
    trimPointsQueue.size > 0 &&
    selectPointDistanceFromStart > trimPointsQueue.peek()!.distanceFromStart
  ) {
    trimSectionStartPoint = trimPointsQueue.pop()!.point
    const nextValue = trimPointsQueue.peek()!

    trimSectionEndPoint = nextValue ? nextValue.point : endPoint
  }

  if (trimPointsQueue.size === 0) {
    // if | designates start of element, || end of element and x - intersections with elements we are trimming by:
    // |---x---x---...--x---<trimmedSection>--||
    const remainingSubsection = createSubsection(
      element,
      startPoint,
      trimSectionStartPoint,
      true,
      subsections
    )
    const removedSubsection = createSubsection(element, trimSectionStartPoint, endPoint, false, subsections)
    return { remaining: [remainingSubsection], removed: [removedSubsection] }
  }

  // if | designates start of element, || end of element and x - intersections with elements we are trimming by:
  // |---x---...---x---<trimmedSection>---x---...--x---||
  // i.e. original element is split into two elements
  let remaining = [
    createSubsection(element, startPoint, trimSectionStartPoint, true, subsections),
    createSubsection(element, trimSectionEndPoint, endPoint, true, subsections),
  ]

  // currently not used - check is done separately for arc, circle and polyline
  // remaining = joinTrimEndSubsections(remaining)

  const removedSubsection = createSubsection(
    element,
    trimSectionStartPoint,
    trimSectionEndPoint,
    false,
    subsections
  )

  return { remaining, removed: [removedSubsection] }
}

const trimWithSelectBox = (
  element: ElementWithId,
  selectPoints: Point[],
  distFunc: (point: Point) => number,
  startPoint: Point,
  endPoint: Point,
  trimPointsQueue: PriorityQueue<TrimPointElementDistances>,
  subsections?: Record<string, PolylineTrimSubsectionElementInfo[]>
) => {
  const selectRect = createElement(Rectangle, { ...selectPoints[0] })
  selectRect.setLastAttribute(selectPoints[1].x, selectPoints[1].y)

  let selectIntersections = ElementIntersector.getIntersections(selectRect as FullyDefinedRectangle, element)

  // we shouldn't trim anything
  if (!selectIntersections) {
    return null
  }

  const sortedSelectDistances: TrimPointElementDistances[] = selectIntersections
    .map((si) => ({ point: si, distanceFromStart: distFunc(si) }))
    .sort((a, b) => (a.distanceFromStart < b.distanceFromStart ? 1 : -1))

  let sectionStartPoint = startPoint
  let sectionStartDistance = 0
  let { point: sectionEndPoint, distanceFromStart: sectionEndDistance } = trimPointsQueue.peek()!
  const sectionsPostTrim = splitIntoRemainingRemovedSections(
    sectionStartPoint,
    sectionEndPoint,
    sectionStartDistance,
    sectionEndDistance,
    sortedSelectDistances,
    selectRect as FullyDefinedRectangle,
    trimPointsQueue,
    distFunc,
    endPoint
  )

  if (!sectionsPostTrim.remaining?.length || !sectionsPostTrim.removed?.length) {
    return null
  }

  // currently not used, check is done separately, at the end, for arc, circle and polyline
  // const finalSectionsPostTrim = {
  //     remaining: joinTrimEndSubsections(sectionsPostTrim.remaining, element),
  //     removed: joinTrimEndSubsections(sectionsPostTrim.removed, element)
  // }

  const remaining = sectionsPostTrim.remaining.map((section) =>
    createSubsection(element, section.start, section.end, true, subsections)
  )

  const removed = sectionsPostTrim.removed.map((section) =>
    createSubsection(element, section.start, section.end, false, subsections)
  )

  return { remaining, removed }
}

function createSubsection(
  element: FullyDefinedElement,
  sectionStart: Point,
  sectionEnd: Point,
  assignId: true,
  subsections?: Record<string, PolylineTrimSubsectionElementInfo[]>
): Ensure<FullyDefinedElement, 'id'>

function createSubsection(
  element: FullyDefinedElement,
  sectionStart: Point,
  sectionEnd: Point,
  assignId: false,
  subsections?: Record<string, PolylineTrimSubsectionElementInfo[]>
): FullyDefinedElement

function createSubsection(
  element: FullyDefinedElement,
  sectionStart: Point,
  sectionEnd: Point,
  assignId: boolean,
  subsections?: Record<string, PolylineTrimSubsectionElementInfo[]>
): Ensure<FullyDefinedElement, 'id'> | FullyDefinedElement

function createSubsection(
  element: FullyDefinedElement,
  sectionStart: Point,
  sectionEnd: Point,
  assignId: boolean,
  subsections?: Record<string, PolylineTrimSubsectionElementInfo[]>
) {
  switch (element.baseType) {
    case 'line': {
      return createLine(sectionStart.x, sectionStart.y, sectionEnd.x, sectionEnd.y, { assignId })
    }
    case 'arc':
      const startPoint = element.startPoint
      const endPoint = element.endPoint

      if (pointsMatch(startPoint, sectionEnd) || pointsMatch(endPoint, sectionStart)) {
        const temp = sectionStart
        sectionStart = sectionEnd
        sectionEnd = temp
      }

    // NOTE: intentional fallthrough to "circle" case
    // eslint-disable-next-line no-fallthrough
    case 'circle': {
      const centerPoint = (element as Circle).centerPoint
      const subsection = createElementFromName('arc', copyPoint(centerPoint), { assignId: true })
      subsection.defineNextAttribute(sectionStart)
      subsection.setLastAttribute(sectionEnd.x, sectionEnd.y)
      return subsection
    }
    case 'polyline': {
      const subsectionElementsInfo = getSubsectionElementsInfo(sectionStart, sectionEnd, subsections!)
      const subElements = trimSubsectionElements(subsectionElementsInfo /*, sectionStart, sectionEnd*/)

      const newSubsection = createElementFromName('polyline', copyPoint(sectionStart), {
        assignId,
      }) as FullyDefinedPolyline

      newSubsection.elements = subElements

      return newSubsection
    }
    default:
      throw new Error('Invalid element baseType')
  }
}

const updateLastTrimSectionEnd = (
  currentSectionElements: PolylineTrimSubsectionElementInfo[],
  sectionEnd: Point,
  currentSubElement: SubElement
) => {
  const lastSectionElement =
    currentSectionElements.length > 0 ? currentSectionElements[currentSectionElements.length - 1] : null
  if (
    lastSectionElement &&
    lastSectionElement.trimStart &&
    currentSubElement.id === lastSectionElement.element.id
  ) {
    // section start is a previous trim point, so last section's end must be set to current trimPoint
    // as it will be unset currently
    lastSectionElement.trimEnd = sectionEnd
    return true
  }

  return false
}

/**
 * Assembles structures consiting of point distances (from polyline's startPoint) of trim points, subElement endPoints and
 * user selection points, together with information about each trim subsection
 * @param polyline Polyline for which point distances and subsections are assembled
 * @param trimPointsByElement an object with keys the ids of the polyline subElements, and values theri respective trim points
 * @param selectPoints points of user selection (mouse clicks)
 * @returns {
 *  pointDistances: {
 *    selection: An array of point distances (object with point and point distance) for points of user selection (clicks),
 *    points: A record of point distances for trim points and subElement endPoints (as values, with points' pointId as key)
 *  },
 *  subsections: Trim subsections - A record with keys the start and end points of the trim subsection (coordinates in string format)
 *  and values an array of objects describing individual elements within this subsection (type PolylineTrimSubsectionElementInfo)
 * }
 */
const assemblePointDistancesAndSubsections = (
  polyline: FullyDefinedPolyline,
  trimPointsByElement: Record<string, Defined<Point, 'pointId'>[]>,
  selectPoints: Point[]
): PointDistancesAndSubsections => {
  let pointDistances: {
    selection: PolylnePointDistance[]
    points: Record<string, number>
  } = {
    selection: [],
    points: {},
  }
  const subsections: Record<string, PolylineTrimSubsectionElementInfo[]> = {}
  let currentSectionElements: PolylineTrimSubsectionElementInfo[] = []
  let sectionStartPoint = polyline.startPoint
  let distanceFromStart = 0

  let lastEndPoint = polyline.startPoint
  for (const subElement of polyline.elements) {
    const isInPolylineDirection = pointsMatch(subElement.startPoint, lastEndPoint)
    const subElementEndPoint = (
      isInPolylineDirection ? subElement.endPoint : subElement.startPoint
    ) as Defined<Point, 'pointId'>

    let subElementDistFunc: (point: Point) => number
    if (subElement.baseType === 'line') {
      subElementDistFunc = getDistFunc('line', { startPoint: lastEndPoint })
    } else {
      subElementDistFunc = getDistFunc('arc', {
        centerPoint: (subElement as FullyDefinedArc).centerPoint,
        startAngle: isInPolylineDirection
          ? (subElement as FullyDefinedArc).startAngle
          : (subElement as FullyDefinedArc).endAngle,
        radius: (subElement as FullyDefinedArc).radius,
        flipAngle: !isInPolylineDirection,
      })

      // if (isInPolylineDirection) {
      //   subElementDistFunc = getDistFunc('arc', {
      //     centerPoint: (subElement as FullyDefinedArc).centerPoint,
      //     startAngle: (subElement as FullyDefinedArc).startAngle
      //   })
      // } else {
      //   // distFunc for an arc calculates distance in degrees in the normal arc visualization
      //   // direction (anti-clockwise). However, with an arc that is a subElement of a polyline
      //   // and is in the opposite direction of the polyline, we need the distance to be calculated
      //   // not only from the endAngle instead of the startAngle, but also in the clockwise direction
      //   subElementDistFunc = (point: Point) => {
      //     return 360 - getDistFunc('arc', {
      //       centerPoint: (subElement as FullyDefinedArc).centerPoint,
      //       startAngle: (subElement as FullyDefinedArc).endAngle
      //     })(point)
      //   }
      // }
    }

    const sortedSubElementTrimPoints = (trimPointsByElement[subElement.id!] || []).sort((a, b) =>
      subElementDistFunc(a) < subElementDistFunc(b) ? -1 : 1
    )
    const subElementStartPoint = isInPolylineDirection ? subElement.startPoint : subElement.endPoint
    let hasMatchedStart = false
    for (const trimPoint of sortedSubElementTrimPoints) {
      const subElementDistance = subElementDistFunc(trimPoint)
      pointDistances.points[trimPoint.pointId] = subElementDistance + distanceFromStart

      const matchesStart = pointsMatch(trimPoint, subElementStartPoint)
      const matchesEnd = pointsMatch(trimPoint, subElementEndPoint)

      if (matchesStart) {
        if (sortedSubElementTrimPoints.length === 1) {
          // whole element is included in current section
          currentSectionElements.push({ element: subElement, isInPolylineDirection })
        } else {
          hasMatchedStart = true
        }
      } else if (matchesEnd) {
        if (
          (hasMatchedStart && sortedSubElementTrimPoints.length === 2) ||
          sortedSubElementTrimPoints.length === 1
        ) {
          // whole element is included in current section
          currentSectionElements.push({ element: subElement, isInPolylineDirection })
        } else {
          // might need to update trimEnd for last polyline subsection to current trim point
          updateLastTrimSectionEnd(currentSectionElements, trimPoint, subElement)
        }

        subsections[getSectionKey(sectionStartPoint, trimPoint)] = currentSectionElements
        currentSectionElements = []
      } else {
        const isLastSectionUpdated = updateLastTrimSectionEnd(currentSectionElements, trimPoint, subElement)

        if (!isLastSectionUpdated) {
          currentSectionElements.push({
            element: subElement,
            isInPolylineDirection,
            trimStart: subElementStartPoint,
            trimEnd: trimPoint,
          })
        }

        // save current section
        subsections[getSectionKey(sectionStartPoint, trimPoint)] = currentSectionElements
        // new section starts from trim point on this subElement
        currentSectionElements = [{ element: subElement, isInPolylineDirection, trimStart: trimPoint }]
      }

      sectionStartPoint = trimPoint
    }

    if (sortedSubElementTrimPoints.length === 0) {
      currentSectionElements.push({ element: subElement, isInPolylineDirection })
    } else {
      updateLastTrimSectionEnd(currentSectionElements, subElementEndPoint, subElement)
    }

    const selectPointDistances = getSelectionPointDistances(
      subElement,
      selectPoints,
      subElementDistFunc,
      distanceFromStart
    )

    pointDistances.selection = pointDistances.selection.concat(selectPointDistances)

    distanceFromStart = distanceFromStart + subElementDistFunc(subElementEndPoint)

    pointDistances.points[subElementEndPoint.pointId] = distanceFromStart

    lastEndPoint = subElementEndPoint
  }

  const sectionEndPoint = polyline.endPoint as Defined<Point, 'pointId'>
  subsections[getSectionKey(sectionStartPoint, sectionEndPoint)] = currentSectionElements

  // distanceFromStart for polyline endPoint is the same as the distanceFromStart for the endPoint of the
  // last element. However, we still need to add the polyline endPoint's pointId to the pointDistances to
  // make things further down work
  pointDistances.points[sectionEndPoint.pointId] = distanceFromStart

  return { pointDistances, subsections }
}

const getDistFunc = (
  elementType: 'line' | 'arc' | 'circle',
  elementParams: LineElementDistFuncParams | ArcElementDistFuncParams
  /*
  { startPoint: lastEndPoint })
      : getDistFunc('arc', {
          centerPoint: (subElement as FullyDefinedArc).centerPoint,
          startAngle: isInPolylineDirection
            ? (subElement as FullyDefinedArc).startAngle
            : (subElement as FullyDefinedArc).endAngle
        })
   */
): ((point: Point) => number) => {
  switch (elementType) {
    case 'line': {
      const { startPoint } = elementParams as LineElementDistFuncParams
      return (point) => getPointDistance(startPoint, point)
    }
    case 'arc':
    case 'circle': {
      // Note: flipAngle = true used when trimming an arc that is a subElement of a polyline
      // and the arc happens to be in the opposite direction of the polyline (isInPolylineDirection = false)
      const { centerPoint, startAngle, radius, flipAngle } = elementParams as ArcElementDistFuncParams
      return (point) => {
        const lineAngle = getAngleBetweenPoints(centerPoint, point)

        let angle: number
        if (lineAngle === startAngle) {
          // line must be to endPoint
          angle = 360
        } else if (lineAngle > startAngle) {
          angle = flipAngle 
            ? lineAngle - startAngle
            : 360 - lineAngle + startAngle
        } else {
          angle = flipAngle 
            ? 360 - startAngle + lineAngle 
            :  startAngle - lineAngle
        }

        return (angle / 360) * 2 * Math.PI * radius
      }
    }
    default:
      throw new Error('Invalid elementType parameter')
  }
}

const getTrimSections = (
  element: ElementWithId,
  trimPoints: Defined<Point, 'pointId'>[],
  selectPoints: Point[],
  distFunc: (point: Point) => number,
  startPoint: Point,
  endPoint: Point,
  subsections?: Record<string, PolylineTrimSubsectionElementInfo[]>
) => {
  const trimPointDistanceQueue = new PriorityQueue<TrimPointElementDistances>(
    (a, b) => a.distanceFromStart < b.distanceFromStart
  )
  let lastDistance = 0
  trimPoints.forEach((point) => {
    const distanceFromStart = distFunc(point)

    if (isDiffSignificant(lastDistance, distanceFromStart)) {
      trimPointDistanceQueue.push({ distanceFromStart, point })
    }

    lastDistance = distanceFromStart
  })

  if (selectPoints.length === 1) {
    return trimWithSingleClick(
      element,
      distFunc(selectPoints[0]),
      startPoint,
      endPoint,
      trimPointDistanceQueue,
      subsections
    )
  }

  return trimWithSelectBox(
    element,
    selectPoints,
    distFunc,
    startPoint,
    endPoint,
    trimPointDistanceQueue,
    subsections
  )
}

const fixJoinedSections = (
  element: FullyDefinedElement,
  subsections: Record<string, PolylineTrimSubsectionElementInfo[]>
) => {
  const startKey = getSectionKeyStart(element.startPoint)
  const subsectionKeys = Object.keys(subsections)
  const newSubsections = { ...subsections }

  const firstSubsectionKey = subsectionKeys.find((sk) => sk.startsWith(startKey))!
  const firstSubsection = subsections[firstSubsectionKey]

  const lastSubsectionKey = subsectionKeys.find((sk) => sk.endsWith(startKey))!
  const lastSubsection = subsections[lastSubsectionKey]

  delete newSubsections[firstSubsectionKey]
  delete newSubsections[lastSubsectionKey]

  const newStartKey = lastSubsectionKey.split(';')[0]
  const newEndKey = firstSubsectionKey.split(';')[1]

  const joinedKey = `${newStartKey};${newEndKey}`
  newSubsections[joinedKey] = lastSubsection.concat(firstSubsection)

  return newSubsections
}

const fixJoinedPointDistances = (
  element: FullyDefinedPolyline,
  pointDistances: {
    selection: PolylnePointDistance[]
    points: Record<string, number>
  },
  lastTrimPoint: Defined<Point, 'pointId'>
) => {
  let newEndPoint: Point
  const newPointDistances = produce(pointDistances, (draft) => {
    delete draft.points[element.startPoint.pointId!]

    const oldEndPointDistance = draft.points[element.endPoint.pointId!]
    delete draft.points[element.endPoint.pointId!]

    const lastSubElement = element.elements[element.elements.length - 1]
    // get lastSubElement.startPoint in case subElement is in reverse direction to the polyline
    const lastSubElementEndPoint = pointsMatch(element.startPoint, lastSubElement.endPoint)
      ? lastSubElement.endPoint
      : lastSubElement.startPoint

    delete draft.points[lastSubElementEndPoint.pointId!]

    const lastTrimPointId = lastTrimPoint.pointId
    const lastTrimPointDistance = draft.points[lastTrimPointId]

    const distanceShift = oldEndPointDistance - lastTrimPointDistance

    for (const pointKey of Object.keys(draft.points)) {
      const pointDistance = draft.points[pointKey]
      if (pointDistance < lastTrimPointDistance) {
        draft.points[pointKey] += distanceShift
      } else {
        draft.points[pointKey] = pointDistance - lastTrimPointDistance
      }
    }

    for (let selectIndex = 0; selectIndex < pointDistances.selection.length; selectIndex++) {
      const { distanceFromStart } = draft.selection[selectIndex]

      if (distanceFromStart < lastTrimPointDistance) {
        draft.selection[selectIndex].distanceFromStart += distanceShift
      } else {
        draft.selection[selectIndex].distanceFromStart = distanceFromStart - lastTrimPointDistance
      }
    }

    delete draft.points[lastTrimPointId]

    newEndPoint = createPoint(lastTrimPoint.x, lastTrimPoint.y, { assignId: true })
    draft.points[newEndPoint!.pointId!] = oldEndPointDistance
  })

  return {
    pointDistances: newPointDistances,
    // @ts-ignore
    newEndPoint,
  }
}

export type TrimPointElementDistances = {
  point: Point
  distanceFromStart: number
}

export type PolylineTrimSubsectionElementInfo = {
  element: SubElement
  isInPolylineDirection: boolean
  trimStart?: Point
  trimEnd?: Point
}

export {
  fixJoinedSections,
  fixJoinedPointDistances,
  assemblePointDistancesAndSubsections,
  getTrimSections,
  getDistFunc,
  createSubsection,
  joinTrimEndSubsections,
}
