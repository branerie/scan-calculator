import { useState } from 'react'
import rough from 'roughjs/bundled/rough.esm'

const generator = rough.generator()

const getPointDistance = (a, b) => Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2))

const createElement = (pointA, pointB, type) => {
    let roughElement = {}

    switch (type) {
        case 'line':
            roughElement = generator.line(pointA.x, pointA.y, pointB.x, pointB.y)
            break
        // case 'rectangle':
        //     roughElement = generator.rectangle(x1, y1, x2 - x1, y2 - y1)
        //     break
        // case 'circle':
        //     const diameter = 2 * getPointDistance({ x: x1, y: y1 }, { x: x2, y: y2 })
        //     roughElement = generator.circle(x1, y1, diameter)
        //     break
        // case 'arc':
        //     const radius = getPointDistance({ x: x1, y: y1 }, { x: x2, y: y2 })
        //     roughElement = generator.path(describeArc(x1, y1, radius, 0, 90))
        //     break

        default:
            return
    }

    return { pointA, pointB, type, roughElement }
}

const nearPoint = (x, y, x1, y1, name) => {
    return Math.abs(x - x1) < 5 && Math.abs(y - y1) < 5 ? name : null
}

const positionWithinElement = (x, y, element) => {
    const { type, x1, x2, y1, y2 } = element
    if (type === 'rectangle') {
        const topLeft = nearPoint(x, y, x1, y1, 'tl')
        const topRight = nearPoint(x, y, x2, y1, 'tr')
        const bottomLeft = nearPoint(x, y, x1, y2, 'bl')
        const bottomRight = nearPoint(x, y, x2, y2, 'br')
        const inside = x >= x1 && x <= x2 && y >= y1 && y <= y2 ? 'inside' : null
        return topLeft || topRight || bottomLeft || bottomRight || inside
    } else {
        const a = { x: x1, y: y1 }
        const b = { x: x2, y: y2 }
        const c = { x, y }
        const offset = getPointDistance(a, b) - (getPointDistance(a, c) + getPointDistance(b, c))
        const start = nearPoint(x, y, x1, y1, 'start')
        const end = nearPoint(x, y, x2, y2, 'end')
        const inside = Math.abs(offset) < 1 ? 'inside' : null
        return start || end || inside
    }
}

const getElementAtPosition = (x, y, elements) => {
    return elements
        .map(element => ({ ...element, position: positionWithinElement(x, y, element) }))
        .find(element => element.position !== null);
}

const adjustElementCoordinates = element => {
    const { type, x1, y1, x2, y2 } = element
    if (type === 'rectangle') {
        const minX = Math.min(x1, x2)
        const maxX = Math.max(x1, x2)
        const minY = Math.min(y1, y2)
        const maxY = Math.max(y1, y2)
        return { x1: minX, y1: minY, x2: maxX, y2: maxY }
    } else {
        if (x1 < x2 || (x1 === x2 && y1 < y2)) {
            return { x1, y1, x2, y2 }
        } else {
            return { x1: x2, y1: y2, x2: x1, y2: y1 }
        }
    }
}

const cursorForPosition = position => {
    switch (position) {
        case 'tl':
        case 'br':
        case 'start':
        case 'end':
            return 'nwse-resize'
        case 'tr':
        case 'bl':
            return 'nesw-resize'
        default:
            return 'move'
    }
}

const resizedCoordinates = (clientX, clientY, position, coordinates) => {
    const { x1, y1, x2, y2 } = coordinates
    switch (position) {
        case 'tl':
        case 'start':
            return { x1: clientX, y1: clientY, x2, y2 }
        case 'tr':
            return { x1, y1: clientY, x2: clientX, y2 }
        case 'bl':
            return { x1: clientX, y1, x2, y2: clientY }
        case 'br':
        case 'end':
            return { x1, y1, x2: clientX, y2: clientY }
        default:
            return null //should not really get here...
    }
}

const useElementsHistory = initialState => {
    const [index, setIndex] = useState(0)
    const [history, setHistory] = useState([initialState])

    const setElements = (newState, overwrite = false) => {
        if (overwrite) {
            const historyCopy = [...history]
            historyCopy[index] = newState
            setHistory(historyCopy)
        } else {
            const updatedState = [...history].slice(0, index + 1)
            setHistory([...updatedState, newState])
            setIndex(prevState => prevState + 1)
        }
    }

    const undo = () => index > 0 && setIndex(prevState => prevState - 1)
    const redo = () => index < history.length - 1 && setIndex(prevState => prevState + 1)

    return { elements: history[index], setElements, undo, redo }
}

const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0

    return {
        x: centerX + (radius * Math.cos(angleInRadians)),
        y: centerY + (radius * Math.sin(angleInRadians))
    }
}

const describeArc = (x, y, radius, startAngle, endAngle) => {

    const start = polarToCartesian(x, y, radius, endAngle)
    const end = polarToCartesian(x, y, radius, startAngle)

    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1'

    const d = [
        'M', start.x, start.y,
        'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y
    ].join(' ')

    return d
}

export {
    createElement,
    getElementAtPosition,
    getPointDistance,
    adjustElementCoordinates,
    cursorForPosition,
    resizedCoordinates,
    useElementsHistory
}