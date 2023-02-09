import { createContext, useContext } from 'react'
import { mountStoreDevtool } from 'simple-zustand-devtools'
import initElementsStore from '../stores/elements/index'
import { ElementsStoreType } from '../stores/elements/index'

// @ts-ignore
const ElementsStoreContext = createContext<ElementsStoreType>()

export function useElementsStoreContext() {
  return useContext(ElementsStoreContext)
}

const ElementsStoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const useElementsStore = initElementsStore()

  // if (process.env.NODE_ENV === 'development') {
  //   mountStoreDevtool('ElementsStore', useElementsStore, document.getElementById('zustand-ElementsStore')!)
  // }

  return <ElementsStoreContext.Provider value={useElementsStore}>{children}</ElementsStoreContext.Provider>
}

export default ElementsStoreProvider
