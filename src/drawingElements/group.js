import Element from './element'

class Group extends Element {
    constructor(elements) {
        super()
        this.elements = elements
    }

    get baseX() {
        return this.elements[0].baseX
    }

    get baseY() {
        return this.elements[0].baseY
    }

    get isFullyDefined() {
        throw new Error('Property isFullyDefined is not implemented')
    }

    /* Should return true if all but the last dimension of the element are defined */
    get isAlmostDefined() {
        throw new Error('Property isAlmostDefined is not implemented')
    }

    getFoundationalElements() {
        return this.elements.map(e => e.getFoundationalElements())
    }

    defineNextAttribute(definingPoint) {
        throw new Error('Method defineNextAttribute is not implemented')
    }

    setLastAttribute(lastPoint) {
        throw new Error('Method setLastAttribute is not implemented')
    }
}

export default Group