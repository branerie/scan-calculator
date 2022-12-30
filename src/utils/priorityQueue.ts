const top = 0
const getParentIndex = (i: number) => ((i + 1) >>> 1) - 1
const getLeftIndex = (i: number) => (i << 1) + 1
const getRightIndex = (i: number) => (i + 1) << 1

export default class PriorityQueue<TType> {
    private _heap: TType[]
    private _comparator: (a: TType, b: TType) => boolean

    constructor(comparator = (a: TType, b: TType) => a > b) {
        this._heap = []
        this._comparator = comparator
    }

    get size() { return this._heap.length }
    get isEmpty() { return this.size === 0 }

    peek() {
        return this._heap[top] || null
    }

    push(...values: TType[]) {
        values.forEach(value => {
            this._heap.push(value)
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

        this._heap.pop()
        this._siftDown()
        return poppedValue
    }

    replace(value: TType) {
        const replacedValue = this.peek()
        this._heap[top] = value
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

    _checkIfGreater(i: number, j: number) {
        return this._comparator(this._heap[i], this._heap[j])
    }

    _swap(i: number, j: number) {
        [this._heap[i], this._heap[j]] = [this._heap[j], this._heap[i]]
    }
}