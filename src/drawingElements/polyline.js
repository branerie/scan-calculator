import Element from './element'

class Polyline extends Element {
    #isFullyDefined
    #createLine

    constructor(initialPoint, groupId, createLine) {
        super(groupId)

        this.elements = [createLine(initialPoint.x, initialPoint.y)]

        this.#createLine = createLine
        this.#isFullyDefined = false
    }

    get baseX() {
        return this.elements.length > 0 ? this.elements[0].baseX : null
    }

    get baseY() {
        return this.elements.length > 0 ? this.elements[0].baseY : null
    }

    get isFullyDefined() {
        return this.#isFullyDefined
    }

    /* Should return true if all but the last dimension of the element are defined */
    get isAlmostDefined() {
        return !!(this.elements[0].pointA)
    }

    getFoundationalElements() {
        return this.elements.map(e => e.getFoundationalElements())
    }

    defineNextAttribute(definingPoint) {
        const lineToDefine = this.elements[this.elements.length - 1]
        lineToDefine.defineNextAttribute(definingPoint)

        const line = this.#createLine(definingPoint.x, definingPoint.y, this.groupId)
        this.elements.push(line)
    }

    setLastAttribute() {
        this.#isFullyDefined = true
    }
}

export default Polyline