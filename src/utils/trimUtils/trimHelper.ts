import Point from '../../drawingElements/point'
import { SubElement } from '../../drawingElements/polyline'
import { SELECT_DELTA } from '../constants'
import { createElement } from '../elementFactory'
import ElementIntersector from '../elementIntersector'
import ElementManipulator from '../elementManipulator'
import { pointsMatch } from '../point'
import { FullyDefinedRectangle } from '../types/index'
import { PolylineSubsection } from './trim'

const updateTrimmedSections = (trimmedSections, newSection, isSectionTrimmed: boolean) => {
    const sectionType = isSectionTrimmed ? 'removed' : 'remaining'
    const sectionsOfType = trimmedSections[sectionType]

    if (sectionsOfType) {
        const lastSection = sectionsOfType[sectionsOfType.length - 1]
        if (pointsMatch(lastSection.end, newSection.start)) {
            sectionsOfType[sectionsOfType.length - 1].end = newSection.end
            return
        }

        if (pointsMatch(lastSection.end, newSection.end)) {
            sectionsOfType[sectionsOfType.length - 1].end = newSection.start
            return
        }

        sectionsOfType.push(newSection)
        return
    }

    trimmedSections[sectionType] = [newSection]
}

const getSelectionPointDistances = (
    subElement: SubElement, 
    selectPoints: Point[], 
    subElementDistFunc: (point: Point) => number, 
    distanceFromElementStart: number
): PolylnePointDistance[] => {
    const selectRect = getSelectRect(selectPoints)
    let selectIntersections: Point[] = []
    if (selectRect) {
        selectIntersections = ElementIntersector.getIntersections(selectRect, subElement) || []
    } else if (subElement.checkIfPointOnElement(selectPoints[0], SELECT_DELTA)) {
        selectIntersections = [selectPoints[0]]
    }

    const selectDistances = []
    for (const intersection of selectIntersections) {
        const intersectionDistance = subElementDistFunc(intersection) + distanceFromElementStart
        selectDistances.push({ point: intersection, distanceFromStart: intersectionDistance })
    }

    return selectDistances
}

const getSectionKey = (startPoint: Point, endPoint: Point) => 
    `${startPoint.x.toFixed(3)},${startPoint.y.toFixed(3)};${endPoint.x.toFixed(3)},${endPoint.y.toFixed(3)}`

const getSectionKeyStart = (startPoint: Point) => `${startPoint.x.toFixed(3)},${startPoint.y.toFixed(3)}`


const splitIntoRemainingRemovedSections = (
    sectionStartPoint: Point,
    sectionEndPoint: Point,
    sectionStartDistance,
    sectionEndDistance,
    selectIntersections,
    selectRect: FullyDefinedRectangle,
    trimPointsQueue,
    distFunc: (point: Point) => number,
    endPoint: Point
) => {
    const sectionsPostTrim = {}
    while (trimPointsQueue.size >= 0) {
        const isSectionTrimmed = getSectionFate(
            selectIntersections,
            sectionStartPoint,
            sectionEndPoint,
            sectionStartDistance,
            sectionEndDistance,
            selectRect
        )

        updateTrimmedSections(sectionsPostTrim, { start: sectionStartPoint, end: sectionEndPoint }, isSectionTrimmed)

        const nextSectionStart = trimPointsQueue.pop()
        if (!nextSectionStart) break

        // move to next section for next loop iteration
        sectionStartPoint = nextSectionStart.point
        sectionStartDistance = nextSectionStart.distanceFromStart

        const nextSectionEnd = trimPointsQueue.peek() ||
            { point: endPoint, distanceFromStart: distFunc(endPoint) }
        sectionEndPoint = nextSectionEnd.point
        sectionEndDistance = nextSectionEnd.distanceFromStart
    }

    return sectionsPostTrim
}

const getSectionFate = (
    selectIntersections,
    sectionStartPoint,
    sectionEndPoint,
    sectionStartDistance,
    sectionEndDistance,
    selectRect,
) => {
    let isSectionTrimmed = false
    let isIntersectionInSection = true
    while (selectIntersections.length > 0 && isIntersectionInSection) {
        const nextIntersection = selectIntersections[selectIntersections.length - 1]

        if (
            nextIntersection.distanceFromStart >= sectionStartDistance &&
            nextIntersection.distanceFromStart <= sectionEndDistance
        ) {
            // an intersection of the element with the selection box occurs in this section
            // therefore, it needs to be trimmed 
            selectIntersections.pop()
            isSectionTrimmed = true
            continue
        }

        isIntersectionInSection = false
    }

    if (isSectionTrimmed) return true

    const {
        left: selectLeft,
        right: selectRight,
        top: selectTop,
        bottom: selectBottom
    } = selectRect.getBoundingBox()

    const [sectionLeft, sectionRight] = [sectionStartPoint.x, sectionEndPoint.x].sort((a, b) => a > b ? 1 : -1)
    const [sectionTop, sectionBottom] = [sectionStartPoint.y, sectionEndPoint.y].sort((a, b) => a > b ? 1 : -1)

    isSectionTrimmed = selectLeft <= sectionLeft && 
                       selectRight >= sectionRight &&
                       selectTop <= sectionTop &&
                       selectBottom >= sectionBottom

    return isSectionTrimmed
}

const getSelectRect = (selectPoints: Point[]) => {
    if (selectPoints.length !== 2) {
        return null
    }

    const selectRect = createElement('rectangle', selectPoints[0])
    selectRect.setLastAttribute(selectPoints[1].x, selectPoints[1].y)

    return selectRect
}

const getSubsectionElements = (sectionStart: Point, sectionEnd: Point, subsections: Record<string, PolylineSubsection[]>) => {
    const sectionKeyStart = getSectionKeyStart(sectionStart)
    const firstKey = Object.keys(subsections).find(k => k.startsWith(sectionKeyStart))!
    let [firstPoint, secondPoint] = firstKey.split(';')
    let subsectionElements: PolylineSubsection[] = []

    while (secondPoint !== getSectionKeyStart(sectionEnd)) {
        subsectionElements = subsectionElements.concat(subsections[`${firstPoint};${secondPoint}`])

        firstPoint = secondPoint
        // eslint-disable-next-line no-loop-func
        secondPoint = Object.keys(subsections).find(k => k.startsWith(secondPoint))!.split(';')[1]
    }

    subsectionElements = subsectionElements.concat(subsections[`${firstPoint};${secondPoint}`])
    return subsectionElements
}

const trimSubsectionElements = (subsectionElements: PolylineSubsection[]) => {
    const subElements = []
    let lastSubElement = null
    for (let subIndex = 0; subIndex < subsectionElements.length; subIndex++) {
        const subsectionElementInfo = subsectionElements[subIndex]
        const { element: subElement, trimStart, trimEnd, isInPolylineDirection } = subsectionElementInfo
        const trimmedSubElement = ElementManipulator.copyElement(subElement, { assignId: true })
        if (!isInPolylineDirection) {
            const tempEnd = trimmedSubElement.startPoint
            trimmedSubElement.startPoint = trimmedSubElement.endPoint
            trimmedSubElement.endPoint = tempEnd
        }

        if (!trimStart) {
            subElements.push(trimmedSubElement)
            lastSubElement = subElement
            continue
        }

        const isSameSubElement = lastSubElement === subElement
        const lastTrimmedSub = subElements.length > 0 ? subElements[subElements.length - 1] : null
        const lastTrimmedSubEnd = lastTrimmedSub ? lastTrimmedSub.endPoint : null
        if (
            isSameSubElement && 
            lastTrimmedSubEnd && 
            pointsMatch(lastTrimmedSubEnd, trimStart)
        ) {
            // we just need to combine the last subElement with the current one
            lastTrimmedSub.endPoint = trimEnd
            lastSubElement = subElement
            continue
        }

        trimmedSubElement.startPoint = trimStart
        trimmedSubElement.endPoint = trimEnd

        subElements.push(trimmedSubElement)
        lastSubElement = subElement
    }

    return subElements
}

export type PolylnePointDistance = {
    point: Point,
    distanceFromStart: number
}

export {
    getSectionFate,
    getSectionKey,
    getSectionKeyStart,
    getSelectRect,
    getSelectionPointDistances,
    getSubsectionElements,
    splitIntoRemainingRemovedSections,
    trimSubsectionElements,
}