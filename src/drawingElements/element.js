class Element {
    constructor(groupId) {
        this.groupId = groupId
    }

    get baseX() {
        throw new Error('Property baseX is not implemented')
    }

    get baseY() {
        throw new Error('Property baseY is not implemented')
    }

    get type() {
        return this.constructor.name.toLowerCase()
    }

    get isFullyDefined() {
        throw new Error('Property isFullyDefined is not implemented')
    }

    /* Should return true if all but the last dimension of the element are defined */
    get isAlmostDefined() {
        throw new Error('Property isAlmostDefined is not implemented')
    }

    getFoundationalElements() {
        throw new Error('Method getFoundationalElements is not implemented')
    }

    defineNextAttribute(definingPoint) {
        throw new Error('Method defineNextAttribute is not implemented')
    }

    setLastAttribute(lastPoint) {
        throw new Error('Method setLastAttribute is not implemented')
    }
}

export default Element