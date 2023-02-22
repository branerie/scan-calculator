import { StateCreator } from 'zustand'
import { ElementWithId } from '../../../drawingElements/element'
import { SelectionPoint } from '../../../utils/types/index'
import { ElementsState } from '../index'

export type SelectionSlice = {
  selectedElements: Map<string, ElementWithId> | null,
  selectedPoints: SelectionPoint[] | null,
  addSelectedElements(elements: ElementWithId[] | ElementWithId): void,
  removeSelectedElements(elements: ElementWithId[] | ElementWithId): void,
  hasSelectedElement(element: ElementWithId | string): boolean,
  setSelectedElements(newElements: ElementWithId[]): void,
  clearSelection(): void,
  setSelectedPoints(newPoints: SelectionPoint[]): void,
  clearSelectedPoints(): void
}

export default function useSelectionSlice() {

  const createSelectionSlice: StateCreator<
    ElementsState,
    [["zustand/immer", never]],
    [],
    SelectionSlice
  > = ((
    set,  
    get,
  ) => ({
    selectedElements: null,
    selectedPoints: null,
    addSelectedElements(elements) {
      const newElements = Array.isArray(elements) ? elements : [elements]
      
      set((state) => {
        if (!state.selectedElements) {
          state.selectedElements = new Map<string, ElementWithId>()
        }

        for (const addedElement of newElements) {
          state.selectedElements.set(addedElement.id, addedElement)
        }
      })
    },
    removeSelectedElements(elementsToRemove) {
      const newElementsToRemove = Array.isArray(elementsToRemove) ? elementsToRemove : [elementsToRemove]
      
      set((state) => {
        if (!state.selectedElements) {
          return
        }

        for (const elementToRemove of newElementsToRemove) {
          state.selectedElements.delete(elementToRemove.id)
        }

        if (state.selectedElements.size === 0) {
          state.selectedElements = null
        }
      })
    },
    hasSelectedElement(elementOrElementId) {
      const selectedElements = get().selectedElements
      if (!selectedElements) {
        return false
      }

      if (typeof elementOrElementId === 'string') {
        return selectedElements.has(elementOrElementId)
      }

      if (elementOrElementId.groupId) {
        return selectedElements.has(elementOrElementId.groupId)
      }

      return selectedElements.has(elementOrElementId.id)
    },
    setSelectedElements(newElements) {
      set({
        selectedElements: newElements.reduce((acc, value) => {
          acc.set(value.id, value)
          return acc
        }, new Map<string, ElementWithId>())
      })
    },
    clearSelection() {
      set({
        selectedElements: null,
        selectedPoints: null
      })
    },
    setSelectedPoints(newPoints) {
      set({
        selectedPoints: newPoints
      })
    },
    clearSelectedPoints() {
      set({
        selectedPoints: null
      })
    },
  }))

  return createSelectionSlice
}