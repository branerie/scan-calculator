import { createPoint } from '../../elementFactory'

function* getNextInterceptPoint({
  slope,
  intercept,
  currentDiv,
  linePointsDiff,
  minDiv,
  maxDiv,
  divSize,
  getSecondaryDimensionIntercept,
  isDivsGoingDown,
  isHorizontal
}: {
  slope: number;
  intercept: number;
  currentDiv: number;
  linePointsDiff: number;
  minDiv: number;
  maxDiv: number;
  divSize: number;
  getSecondaryDimensionIntercept: (slope: number, intercept: number, lineY: number) => number;
  isDivsGoingDown: boolean;
  isHorizontal: boolean;
}) {
  if (linePointsDiff === 0) {
    return null
  }

  if (isDivsGoingDown) {
    for (let divNum = currentDiv; divNum > minDiv; divNum--) {
      const currentDivCoordinate = divNum * divSize
      const secondaryDimCoordinate = getSecondaryDimensionIntercept(
        slope,
        intercept,
        currentDivCoordinate
      )

      const interceptPoint = isHorizontal
        ? createPoint(currentDivCoordinate, secondaryDimCoordinate)
        : createPoint(secondaryDimCoordinate, currentDivCoordinate)
      
      yield interceptPoint
    }
  } else {
    for (let divNum = currentDiv + 1; divNum < maxDiv; divNum++) {
      const currentDivCoordinate = divNum * divSize
      const secondaryDimCoordinate = getSecondaryDimensionIntercept(
        slope,
        intercept,
        currentDivCoordinate
      )

      const interceptPoint = isHorizontal
        ? createPoint(currentDivCoordinate, secondaryDimCoordinate)
        : createPoint(secondaryDimCoordinate, currentDivCoordinate)

      yield interceptPoint
    }
  }

  return null
}

export { getNextInterceptPoint }
