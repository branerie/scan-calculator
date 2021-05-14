import { createLine, createPoint } from './elementFactory'

const getPerpendicularPointToLine = (initialPoint, line) => {
    if (line.isVertical) {
        return createPoint(line.pointA.x, initialPoint.y)
    }

    if (line.isHorizontal) {
        return createPoint(initialPoint.x, line.pointA.y)
    }

    const { slope, intercept: lineIntercept } = line.equation

    // mp = - 1 / m (slope of perpendicular)
    // bp = yp - mp * xp = yp + (xp / m)
    const perpendicularIntercept = initialPoint.y + initialPoint.x / slope

    const intersectX = slope * (perpendicularIntercept - lineIntercept) / (slope ** 2 + 1)
    const intersectY = intersectX * slope + lineIntercept

    return createPoint(intersectX, intersectY)
}

const getPerpendicularToLine = (initialPoint, line) => {
    const perpendicularPoint = getPerpendicularPointToLine(initialPoint, line)
    return createLine(initialPoint.x, initialPoint.y, perpendicularPoint.x, perpendicularPoint.y)
}

export {
    getPerpendicularPointToLine,
    getPerpendicularToLine
}