const top = 0
const getParentIndex = i => ((i + 1) >>> 1) - 1
const getLeftIndex = i => (i << 1) + 1
const getRightIndex = i => (i + 1) << 1

class PriorityQueue {
    #heap
    #comparator

    constructor(comparator = (a, b) => a > b) {
        this.#heap = []
        this.#comparator = comparator
    }

    get size() { return this.#heap.length }
    get isEmpty() { return this.size === 0 }

    peek() {
        return this.#heap[top] || null
    }

    push(...values) {
        values.forEach(value => {
            this.#heap.push(value)
            this._siftUp()
        })

        return this.size
    }

    pop() {
        if (this.size === 0) {
            return null
        }

        const poppedValue = this.peek()
        const bottom = this.size - 1
        if (bottom > top) {
            this._swap(top, bottom)
        }

        this.#heap.pop()
        this._siftDown()
        return poppedValue
    }

    replace(value) {
        const replacedValue = this.peek()
        this.#heap[top] = value
        this._siftDown()

        return replacedValue
    }

    _siftUp() {
        let nodeIndex = this.size - 1
        let parentIndex = getParentIndex(nodeIndex)
        while (nodeIndex > top && this._checkIfGreater(nodeIndex, parentIndex)) {
            this._swap(nodeIndex, parentIndex)
            nodeIndex = parentIndex
            parentIndex = getParentIndex(nodeIndex)
        }
    }

    _siftDown() {
        let nodeIndex = top
        let leftIndex = getLeftIndex(nodeIndex)
        let rightIndex = getRightIndex(nodeIndex)
        const heapSize = this.size
        while (
            (leftIndex < heapSize && this._checkIfGreater(leftIndex, nodeIndex)) ||
            (rightIndex < heapSize && this._checkIfGreater(rightIndex, nodeIndex))
        ) {
            const maxChildIndex = (rightIndex < heapSize && this._checkIfGreater(rightIndex, leftIndex)) 
                        ? rightIndex 
                        : leftIndex
            this._swap(nodeIndex, maxChildIndex)
            nodeIndex = maxChildIndex
            leftIndex = getLeftIndex(nodeIndex)
            rightIndex = getRightIndex(nodeIndex)
        }
    }

    _checkIfGreater(i, j) {
        return this.#comparator(this.#heap[i], this.#heap[j])
    }

    _swap(i, j) {
        [this.#heap[i], this.#heap[j]] = [this.#heap[j], this.#heap[i]]
    }
}

export default PriorityQueue