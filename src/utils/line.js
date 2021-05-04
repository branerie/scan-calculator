import { createLine, createPoint } from './elementFactory'

const getPerpendicularPointToLine = (initialPoint, line) => {
    if (line.isVertical) {
        return createPoint(line.pointA.x, initialPoint.y)
    }

    if (line.isHorizontal) {
        return createPoint(initialPoint.x, line.pointA.y)
    }

    // m = (y2 - y1) / (x2 - x1)
    const slope = (line.pointB.y - line.pointA.y) / (line.pointB.x - line.pointA.x)

    // b = y - m * x
    const lineIntercept = line.pointA.y - line.pointA.x * slope

    // mp = - 1 / m (slope of perpendicular)
    // bp = yp - mp * xp = yp + (xp / m)
    const perpendicularIntercept = initialPoint.y + initialPoint.x / slope

    const intersectX = slope * (perpendicularIntercept - lineIntercept) / (slope ** 2 + 1)
    const intersectY = intersectX * slope + lineIntercept

    return createPoint(intersectX, intersectY)
}

const getPerpendicularToLine = (initialPoint, line) => {
    const perpendicularPoint = getPerpendicularPointToLine(initialPoint, line)
    return createLine(initialPoint.x, initialPoint.y, null, perpendicularPoint.x, perpendicularPoint.y)
}

export {
    getPerpendicularPointToLine,
    getPerpendicularToLine
}