import { immerable } from 'immer'
import { areAlmostEqual, isDiffSignificant } from '../number'

export default class Node<TData extends TreeData> {
  [immerable] = true

  private _leftData: TData[]
  private _rightData: TData[]
  nodeValue: number
  left: Node<TData> | null
  right: Node<TData> | null

  constructor(nodeValue: number) {
    this.nodeValue = nodeValue
    this.left = null
    this.right = null
    this._leftData = []
    this._rightData = []
  }

  insert(value: number, data: TData) {
    if (value < this.nodeValue || areAlmostEqual(value, this.nodeValue)) {
      if (this.left) {
        this.left.insert(value, data)
        return
      }

      this._leftData.push(data)
      return
    }

    if (this.right) {
      this.right.insert(value, data)
      return
    }

    this._rightData.push(data)
  }

  find(minValue: number, maxValue: number, dataFilters?: Partial<TData>) {
    let leftSideResults: TData[] = []
    if (minValue < this.nodeValue || areAlmostEqual(minValue, this.nodeValue)) {
      leftSideResults = this.left
        ? this.left.find(minValue, maxValue, dataFilters)
        : this._leftData.filter(data => data.leafValue >= minValue && data.leafValue <= maxValue)
    }

    let rightSideResults: TData[] = []
    if (maxValue > this.nodeValue || areAlmostEqual(maxValue, this.nodeValue)) {
      rightSideResults = this.right
        ? this.right.find(minValue, maxValue, dataFilters) // Note: possible bug fix by adding dataFilters as param, but could be new bug
        : this._rightData.filter(data => data.leafValue >= minValue && data.leafValue <= maxValue)
    }

    const results = leftSideResults.concat(rightSideResults)
    if (dataFilters) {
      return filterData(results, dataFilters, true)
    }

    return results
  }

  remove(nodeValue: number, dataFilters: Partial<TData>): boolean {
    if (nodeValue < this.nodeValue || areAlmostEqual(nodeValue, this.nodeValue)) {
      if (this.left) {
        return this.left.remove(nodeValue, dataFilters)
      }

      const dataCountBeforeRemove = this._leftData.length
      this._leftData = filterData(this._leftData, dataFilters, false)

      return this._leftData.length < dataCountBeforeRemove
    }

    if (this.right) {
      return this.right.remove(nodeValue, dataFilters)
    }

    const dataCountBeforeRemove = this._rightData.length
    this._rightData = filterData(this._rightData, dataFilters, false)

    return this._rightData.length < dataCountBeforeRemove
  }

  replace(
    nodeValue: number, 
    dataFilters: Partial<TData>, 
    newNodeValue: number, 
    newData: TData
  ) {
    this.remove(nodeValue, dataFilters)
    this.insert(newNodeValue, newData)
  }

  toArray() {
    let data: TData[] = []
    if (this.left) {
      data = data.concat(this.left.toArray())
    }

    if (this.right) {
      data = data.concat(this.right.toArray())
    }

    if (this._leftData) {
      data = data.concat(this._leftData)
    }

    if (this._rightData) {
      data = data.concat(this._rightData)
    }

    return data
  }
}

export type TreeData = {
  leafValue: number,
  [key: string]: unknown
}

function filterData<TData extends TreeData>(
  data: TData[], 
  dataFilters: Partial<TData>, 
  shouldFulfillFilters = true
) {
  return data.filter(dataEntry => {
    for (const key of Object.keys(dataFilters)) {
      const filterValue = dataFilters[key as keyof typeof dataFilters]
      const isNumberData = typeof filterValue === 'number'

      if (
        (isNumberData && isDiffSignificant(filterValue, dataEntry[key] as number)) ||
        (!isNumberData && dataEntry[key] !== dataFilters[key])
      ) {
        return !shouldFulfillFilters
      }
    }

    return shouldFulfillFilters
  })
}