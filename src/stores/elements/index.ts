import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import useElementsSlice, { ElementsSlice } from './slices/useElementsSlice'
import useSelectionPointsSlice, { SelectionPointsSlice } from './slices/useSelectionPointsSlice'
import useSelectionSlice, { SelectionSlice } from './slices/useSelectionSlice'
import useHistorySlice, { HistorySlice } from './slices/useHistorySlice'

const initElementsStore = () => create(
  immer<ElementsState>((set, get, store) => ({
    ...useElementsSlice()(set, get, store),
    ...useSelectionPointsSlice()(set, get, store),
    ...useSelectionSlice()(set, get, store),
    ...useHistorySlice()(set, get, store),
  }))
)

export default initElementsStore

export type ElementsStoreType = ReturnType<typeof initElementsStore>
export type ElementsState = ElementsSlice & SelectionPointsSlice & SelectionSlice & HistorySlice
