import { MAX_NUM_ERROR } from '../constants'
import { ElementGridIntersection, getDimensionDivision1d, parseDivKey, sortDivsByArcIntersectionOrder } from '../hashGrid/utils'
import { getLineX, getLineY } from '../line'
import { getPointDistance } from '../point'
import PriorityQueue from '../priorityQueue'
import { getNextInterceptPoint } from './utils/gridUtils'
import { getArcIntersectionsWithAxis } from '../hashGrid/extensions/arc'
import ElementManipulator from '../elementManipulator'
import { getAngleBetweenPoints } from '../angle'
import { getContainingDivsFromIntersectionPoint } from '../hashGrid/extensions/common'
import { getPointsAngleDistance } from '../arc'
import ElementContainer, { DivContentsYieldResult } from './elementContainer'
import HashGrid from '../hashGrid/index.js'
import Point from '../../drawingElements/point'
import Line from '../../drawingElements/line'
import { Ensure } from '../types/generics'
import Arc from '../../drawingElements/arc'
import { ElementWithId } from '../../drawingElements/element'

class HashGridElementContainer implements ElementContainer {
  private _hashGrid: HashGrid
  constructor(hashGrid: HashGrid) {
    this._hashGrid = hashGrid
  }

  addElements(newElements: ElementWithId[]) {
    return this._hashGrid.addElements(newElements)
  }
  
  removeElements(removedElements: ElementWithId[]) {
    return this._hashGrid.removeElements(removedElements)
  }
  removeElementById(elementId: string) {
    return this._hashGrid.removeElementById(elementId)
  }
  changeElements(changedElements: ElementWithId[]) {
    return this._hashGrid.changeElements(changedElements)
  }
  setElements(newElements: ElementWithId[]) {
    return this._hashGrid.setElements(newElements)
  }
  getElementsNearPoint(pointX: number, pointY: number) {
    return this._hashGrid.getDivisionContentsFromCoordinates(pointX, pointY)
  }

  getElementsInContainer(firstContainerPoint: Point, secondContainerPoint: Point) {
    return this._hashGrid.getContainerContents(firstContainerPoint, secondContainerPoint)
  }

  getElementIdsNearElement(element: ElementWithId) {
    return this._hashGrid.getElementIdsNearElement(element)
  }

  checkPointsLocality(pointA: Point, pointB: Point) {
    // returns true if both points are in the same hash grid division, false otherwise
    const pointADivision = this._hashGrid.getPointDivision(pointA)
    const pointBDivision = this._hashGrid.getPointDivision(pointB)

    return pointADivision[0] === pointBDivision[0] && pointADivision[1] === pointBDivision[1]
  }

  checkIfPointInDivision(point: Point, division: [number, number]) {
    const pointDivision = this._hashGrid.getPointDivision(point)
    return division[0] === pointDivision[0] && division[1] === pointDivision[1]
  }

  *getNextElementsInLineDirection(
    line: Ensure<Line, 'id' | 'startPoint' | 'endPoint'>, 
    fromStart: boolean
  ): Generator<DivContentsYieldResult, null> {
    const pointOfExtend = fromStart ? line.startPoint : line.endPoint
    const contents = this._hashGrid
        .getDivisionContentsFromCoordinates(pointOfExtend.x, pointOfExtend.y)
        
    contents.delete(line.id)

    const thisGrid = this
    yield {
      divContents: contents,
      checkIfPointInSameDiv: function(point: Point) {
        return thisGrid.checkIfPointInDivision(
          point, 
          thisGrid._hashGrid.getPointDivision(pointOfExtend)
        )
      }
    }

    const linePointsXDiff = line.startPoint.x - line.endPoint.x
    const xDivsGoingDown = (fromStart && linePointsXDiff < 0) || (!fromStart && linePointsXDiff > 0)

    const linePointsYDiff = line.startPoint.y - line.endPoint.y
    const yDivsGoingDown = (fromStart && linePointsYDiff < 0) || (!fromStart && linePointsYDiff > 0)

    const xDiv = getDimensionDivision1d(
      pointOfExtend.x,
      this._hashGrid.minXDiv,
      this._hashGrid.divSizeX
    )
    const yDiv = getDimensionDivision1d(
      pointOfExtend.y,
      this._hashGrid.minYDiv,
      this._hashGrid.divSizeY
    )

    const { slope, intercept } = line.equation
    const { minXDiv, maxXDiv, minYDiv, maxYDiv } = this._hashGrid.range
    const xDivInterceptGen = getNextInterceptPoint({
      slope,
      intercept,
      currentDiv: xDiv,
      linePointsDiff: linePointsXDiff,
      minDiv: minXDiv,
      maxDiv: maxXDiv,
      divSize: this._hashGrid.divSizeX,
      getSecondaryDimensionIntercept: getLineY,
      isDivsGoingDown: xDivsGoingDown,
      isHorizontal: true
    })

    const yDivInterceptGen = getNextInterceptPoint({
      slope,
      intercept,
      currentDiv: yDiv,
      linePointsDiff: linePointsYDiff,
      minDiv: minYDiv,
      maxDiv: maxYDiv,
      divSize: this._hashGrid.divSizeY,
      getSecondaryDimensionIntercept: getLineX,
      isDivsGoingDown: yDivsGoingDown,
      isHorizontal: false
    })

    const queue = new PriorityQueue<Point>((a, b) => {
      const distanceFromA = getPointDistance(pointOfExtend, a)
      const distanceFromB = getPointDistance(pointOfExtend, b)

      return distanceFromA < distanceFromB
    })

    const nextXDivIntercept = xDivInterceptGen.next().value
    if (nextXDivIntercept) {
      queue.push(nextXDivIntercept)
    }

    const nextYDivIntercept = yDivInterceptGen.next().value
    if (nextYDivIntercept) {
      queue.push(nextYDivIntercept)
    }

    let lastDivision = { xDiv, yDiv }
    while (queue.size > 0) {
      const interceptPoint = queue.pop()

      if (interceptPoint) {
        const nextDivision = this.__getDivTransitionFromPoint(interceptPoint, {
          lastDivision,
          xDivsGoingDown,
          yDivsGoingDown
        })

        if (!nextDivision) {
          break
        }

        const divContents = this._hashGrid.getDivisionContents(nextDivision.xDiv, nextDivision.yDiv)

        yield {
          divContents: divContents || new Set(),
          checkIfPointInSameDiv: function(point: Point) {
            return thisGrid.checkIfPointInDivision(point, [nextDivision.xDiv, nextDivision.yDiv])
          }
        }

        lastDivision = nextDivision
      }

      // prepare for next round(s) of loop
      const nextXDivIntercept = xDivInterceptGen.next().value
      if (nextXDivIntercept) {
        queue.push(nextXDivIntercept)
      }

      const nextYDivIntercept = yDivInterceptGen.next().value
      if (nextYDivIntercept) {
        queue.push(nextYDivIntercept)
      }
    }

    return null
  }

  *getNextElementsInArcDirection(
    arc: Ensure<Arc, 'id' | 'startPoint' | 'endPoint'>, 
    fromStart: boolean
  ): Generator<DivContentsYieldResult, null> {
    const pointOfExtend = fromStart ? arc.startPoint : arc.endPoint

    const contents = this._hashGrid
        .getDivisionContentsFromCoordinates(pointOfExtend.x, pointOfExtend.y)

    contents.delete(arc.id)
    const thisGrid = this
    yield {
      divContents: contents,
      checkIfPointInSameDiv: function(point) {
        return thisGrid.checkIfPointInDivision(point, thisGrid._hashGrid.getPointDivision(pointOfExtend))
      }
    }

    const arcExtension = ElementManipulator.copyArc(arc, true)
    const oldStartPoint = arcExtension.startPoint!
    const oldEndPoint = arcExtension.endPoint!

    if (!oldStartPoint.pointId || !oldEndPoint.pointId) {
      throw new Error('Arc contains points with no pointId set')
    }

    arcExtension.setPointById(oldStartPoint.pointId, oldEndPoint.x, oldEndPoint.y)
    arcExtension.setPointById(oldEndPoint.pointId, oldStartPoint.x, oldStartPoint.y)

    const { left, right, top, bottom } = arcExtension.getBoundingBox()
    const checkIfPointOnExtension = arcExtension.checkIfPointOnElement.bind(arcExtension)
    const arcExtensionHIntersectionsGen = getArcIntersectionsWithAxis.call(this._hashGrid, {
      centerPoint: arcExtension.centerPoint,
      radius: arcExtension.radius,
      startPoint: arcExtension.startPoint!,
      min: getDimensionDivision1d(top, this._hashGrid.minYDiv, this._hashGrid.divSizeY),
      max: getDimensionDivision1d(bottom, this._hashGrid.minYDiv, this._hashGrid.divSizeY),
      axis: 'x',
      checkIfPointOnElement: checkIfPointOnExtension
    })

    const arcExtensionVIntersectionsGen = getArcIntersectionsWithAxis.call(this._hashGrid, {
      centerPoint: arcExtension.centerPoint,
      radius: arcExtension.radius,
      startPoint: arcExtension.startPoint!,
      min: getDimensionDivision1d(left, this._hashGrid.minXDiv, this._hashGrid.divSizeX),
      max: getDimensionDivision1d(right, this._hashGrid.minXDiv, this._hashGrid.divSizeX),
      axis: 'y',
      checkIfPointOnElement: checkIfPointOnExtension
    })

    const centerPoint = arcExtension.centerPoint
    const queue = new PriorityQueue<ElementGridIntersection & { angle: number }>(
      (intersectionA, intersectionB) => intersectionA.distanceFromStart < intersectionB.distanceFromStart
    )

    for (const arcHIntersection of arcExtensionHIntersectionsGen) {
      const angleDistance = getPointsAngleDistance(
        centerPoint,
        fromStart,
        pointOfExtend,
        arcHIntersection.point
      )

      queue.push({
        point: arcHIntersection.point,
        crossing: arcHIntersection.crossing,
        distanceFromStart: angleDistance,
        angle: getAngleBetweenPoints(centerPoint, arcHIntersection.point)
      })
    }

    for (const arcVIntersection of arcExtensionVIntersectionsGen) {
      const angleDistance = getPointsAngleDistance(
        centerPoint,
        fromStart,
        pointOfExtend,
        arcVIntersection.point
      )

      queue.push({
        point: arcVIntersection.point,
        crossing: arcVIntersection.crossing,
        distanceFromStart: angleDistance,
        angle: getAngleBetweenPoints(centerPoint, arcVIntersection.point)
      })
    }

    while (queue.size > 0) {
      const currentIntersection = queue.pop()

      const intersectionDivs = getContainingDivsFromIntersectionPoint
          .call(this._hashGrid, currentIntersection!.point, currentIntersection!.crossing)
          .map(parseDivKey) as [number, number][]

      const sortedDivs = sortDivsByArcIntersectionOrder(
        intersectionDivs,
        currentIntersection!.angle,
        currentIntersection!.crossing
      )

      yield {
        divContents: this._hashGrid.getDivisionContents(...sortedDivs[0]) || new Set(),
        checkIfPointInSameDiv: function(this: HashGridElementContainer, point: Point) {
          return this.checkIfPointInDivision(point, sortedDivs[0])
        }.bind(this)
      }

      yield {
        divContents: this._hashGrid.getDivisionContents(...sortedDivs[1]) || new Set(),
        checkIfPointInSameDiv: function(this: HashGridElementContainer, point: Point) {
          return this.checkIfPointInDivision(point, sortedDivs[1])
        }.bind(this)
      }
    }

    return null
  }

  __getDivTransitionFromPoint(
    point: Point, 
    options: { 
    lastDivision: { xDiv: number, yDiv: number }, 
    xDivsGoingDown: boolean, 
    yDivsGoingDown: boolean 
  }) {
    const { lastDivision, xDivsGoingDown, yDivsGoingDown } = options

    const interceptsHorizontalBorder = Math.abs(point.x % this._hashGrid.divSizeX) < MAX_NUM_ERROR
    const interceptsVerticalBorder = Math.abs(point.y % this._hashGrid.divSizeY) < MAX_NUM_ERROR

    if (!interceptsHorizontalBorder && !interceptsVerticalBorder) {
      throw new Error(
        `Invalid line intercept point. The point ${point.x}, ${point.y} does not intercept with the hash grid`
      )
    }

    let potentialNewXDiv: number
    if (xDivsGoingDown) {
      if (lastDivision.xDiv === this._hashGrid.minXDiv) {
        return null
      }

      potentialNewXDiv = lastDivision.xDiv - 1
    } else {
      if (lastDivision.xDiv === this._hashGrid.maxXDiv) {
        return null
      }

      potentialNewXDiv = lastDivision.xDiv + 1
    }

    let potentialNewYDiv: number
    if (yDivsGoingDown) {
      if (lastDivision.yDiv === this._hashGrid.minYDiv) {
        return null
      }

      potentialNewYDiv = lastDivision.yDiv - 1
    } else {
      if (lastDivision.yDiv === this._hashGrid.maxYDiv) {
        return null
      }

      potentialNewYDiv = lastDivision.yDiv + 1
    }
    
    if (interceptsHorizontalBorder && !interceptsVerticalBorder) {
      return { xDiv: potentialNewXDiv, yDiv: lastDivision.yDiv }
    } else if (!interceptsHorizontalBorder && interceptsVerticalBorder) {
      return { xDiv: lastDivision.xDiv, yDiv: potentialNewYDiv }
    }

    // intercepts both x and y division borders at the same time
    return { xDiv: potentialNewXDiv, yDiv: potentialNewYDiv }
  }
}

export default HashGridElementContainer
