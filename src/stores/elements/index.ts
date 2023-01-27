import create from 'zustand'
import { immer } from 'zustand/middleware/immer'
import useElementsSlice, { ElementsSlice } from './slices/useElementsSlice'
import useSelectionPointsSlice, { SelectionPointsSlice } from './slices/useSelectionPointsSlice'
import useSelectionSlice, { SelectionSlice } from './slices/useSelectionSlice'
import useHistorySlice, { HistorySlice } from './slices/useHistorySlice'

const useElementsStore = () => {
  const createElementsSlice = useElementsSlice()
  const createSelectionPointsSlice = useSelectionPointsSlice()
  const createSelectionSlice = useSelectionSlice()
  const createHistorySlice = useHistorySlice()

  return create(
    immer<ElementsState>((set, get, store) => ({
      ...createElementsSlice(set, get, store),
      ...createSelectionPointsSlice(set, get, store),
      ...createSelectionSlice(set, get, store),
      ...createHistorySlice(set, get, store),
    }))
  )
}

export default useElementsStore

export type ElementsState = ElementsSlice & SelectionPointsSlice & SelectionSlice & HistorySlice
