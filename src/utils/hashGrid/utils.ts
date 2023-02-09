import Point from '../../drawingElements/point';
import { getQuadrantFromAngle } from '../angle'

export enum CrossingType {
  Vertical = 'V',
  Horizontal = 'H',
  Both = 'B'
}

export type ElementGridIntersection = {
  point: Point;
  distanceFromStart: number;
  crossing: CrossingType;
}

const getDimensionDivision1d = (dim: number, dimStart: number, divisionSize: number) => {
  return Math.floor((dim - dimStart) / divisionSize)
}

const getDivKey = (xDivIndex: number, yDivIndex: number) => `${xDivIndex},${yDivIndex}`

const parseDivKey= (divKey: string) => divKey.split(',').map(Number)


const sortDivs = (divs: [number, number][], crossingVertical: boolean = false, ascending: boolean = false) => {
  const axisIndex = crossingVertical ? 0 : 1

  if (ascending) {
    return divs.sort((a, b) => a[axisIndex] - b[axisIndex])
  }

  return divs.sort((a, b) => b[axisIndex] - a[axisIndex])
}

const sortDivsByArcIntersectionOrder = (
  intersectionDivsTuple: [number, number][], 
  intersectionAngleFromArcCenter: number, 
  crossing: CrossingType
) => {
  const intersectionQuadrant = getQuadrantFromAngle(intersectionAngleFromArcCenter)

  if (intersectionQuadrant === 0) {
    switch (intersectionAngleFromArcCenter) {
      case 0:
      case 360:
        // first div is the one with smaller x-index
        return sortDivs(intersectionDivsTuple, true, true)
      case 90:
        // first div is the one with smaller y-index
        return sortDivs(intersectionDivsTuple, false, true)
      case 180:
        // first div is the one with larger x-index
        return sortDivs(intersectionDivsTuple, true, false)
      case 270:
        // first div is the one with larger y-index
        return sortDivs(intersectionDivsTuple, false, false)
      default:
        throw new Error(
          `Invalid intersection (quadrant, angle) pair - (${intersectionQuadrant},${intersectionAngleFromArcCenter})`
        )
    }
  }

  if (crossing === CrossingType.Both) {
    if (intersectionQuadrant < 3) {
      return sortDivs(intersectionDivsTuple, false, true)
    }

    return sortDivs(intersectionDivsTuple, false, false)
  }

  const crossingVertical = crossing === CrossingType.Vertical
  let shouldSortAscending
  if (crossingVertical) {
    shouldSortAscending = intersectionQuadrant === 1 || intersectionQuadrant === 4
  } else {
    shouldSortAscending = intersectionQuadrant < 3
  }

  return sortDivs(intersectionDivsTuple, crossingVertical, shouldSortAscending)
}

export {
  getDimensionDivision1d,
  getDivKey,
  parseDivKey,
  sortDivsByArcIntersectionOrder
}