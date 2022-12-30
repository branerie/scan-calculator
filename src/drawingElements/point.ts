class Point {
    x: number
    y: number
    elementId?: string
    pointId?: string

    constructor(x: number, y: number, elementId?: string) {
        this.x = x
        this.y = y
        this.elementId = elementId
    }
}

export default Point