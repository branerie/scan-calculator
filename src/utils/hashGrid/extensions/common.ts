import Point from '../../../drawingElements/point'
import { MAX_NUM_ERROR } from '../../constants'
import HashGrid from '../'
import { CrossingType, ElementGridIntersection, getDimensionDivision1d, getDivKey } from '../utils'
import PriorityQueue from '../../priorityQueue'
import { areAlmostEqual } from '../../number'

function getContainingDivsFromIntersectionPoint(this: HashGrid, point: Point, crossingAxis: CrossingType): [string, string] {
  // returns an array with two values, containing the hash grid divisions
  // between which the intersection point lies    
  const intersectionInitX = getDimensionDivision1d(
    point.x,
    this.minXDiv,
    this.divSizeX
  )
  const intersectionInitY = getDimensionDivision1d(
    point.y,
    this.minYDiv,
    this.divSizeY
  )

  const firstDivision = getDivKey(intersectionInitX, intersectionInitY)

  // We have added first div of intersection. The function "getDimensionDivision1d" always returns the lower number
  // in case of an intersection and, therefore, we can always find the second div part of the intersection by adding
  // one to the X-div, Y-div or both (in case of a diagonal crossing)
  let secondDivision = null
  switch (crossingAxis) {
    case 'H':
      secondDivision = getDivKey(intersectionInitX, intersectionInitY - 1)
      break
    case 'V':
      secondDivision = getDivKey(intersectionInitX - 1, intersectionInitY)
      break
    case 'B':
      secondDivision = getDivKey(intersectionInitX - 1, intersectionInitY - 1)
      break
    default:
      throw new Error('Invalid value for "crossing" property of element : HashGrid intersection')
  }

  return [
    firstDivision,
    secondDivision
  ]
}

function getContainingDivsFromIntersectionsQueue(
  this: HashGrid, 
  intersectionsQueue: PriorityQueue<ElementGridIntersection>
) {
  const containingDivs = new Set<string>()
  while (intersectionsQueue.size > 0) {
    const currentIntersection = intersectionsQueue.pop()!
    const nextIntersection = intersectionsQueue.peek()

    if (
      !!nextIntersection &&
      areAlmostEqual(currentIntersection.distanceFromStart, nextIntersection.distanceFromStart)
    ) {
      if (currentIntersection.crossing !== nextIntersection.crossing) {
        // line is crossing through an intersection in the HashGrid (therefore is passing through
        // grids diagonally and we can join these two intersections)
        nextIntersection.crossing = CrossingType.Both
        continue
      }

      throw new Error('An error occurred while calculating HashGrid divs of line')
    }

    const intersectionDivs = getContainingDivsFromIntersectionPoint.call(
      this,
      currentIntersection.point,
      currentIntersection.crossing
    )

    containingDivs.add(intersectionDivs[0])
    containingDivs.add(intersectionDivs[1])
  }

  return containingDivs
}

function checkIntersectionAngleConsistency(angle: number): 0 | 90 | 180 | 270 | 360 {
  if(areAlmostEqual(angle, 0)) {
    return 0
  }

  if (areAlmostEqual(angle, 90)) {
    return 90
  }

  if (areAlmostEqual(angle, 180)) {
    return 180
  }

  if (areAlmostEqual(angle, 270)) {
    return 270
  }

  if (areAlmostEqual(angle, 360)) {
    return 360
  }

  throw new Error('Invalid hash grid intersection angle - should be one of { 0, 90, 180, 270, 360 }')
}

export { 
  getContainingDivsFromIntersectionPoint,
  getContainingDivsFromIntersectionsQueue,
  checkIntersectionAngleConsistency
}
