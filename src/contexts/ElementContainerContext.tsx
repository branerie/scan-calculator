import React, { createContext, useContext } from 'react'
import { CANVAS_HEIGHT, CANVAS_WIDTH } from '../utils/constants'
import ElementContainer from '../utils/elementContainers/elementContainer'
import HashGridElementContainer from '../utils/elementContainers/hashGrid'
import HashGrid from '../utils/hashGrid/index'

const HASH_GRID_DIV_SIZE_X = 80
const HASH_GRID_DIV_SIZE_Y = 40

const hashGrid = new HashGrid(
  Math.ceil(CANVAS_WIDTH / HASH_GRID_DIV_SIZE_X),
  HASH_GRID_DIV_SIZE_X,
  Math.ceil(CANVAS_HEIGHT / HASH_GRID_DIV_SIZE_Y),
  HASH_GRID_DIV_SIZE_Y
)

const ContainerContext = createContext<ElementContainer>(
  new HashGridElementContainer(hashGrid)
)

export function useElementContainerContext() {
  return useContext(ContainerContext)
}

const ElementContainerProvider: React.FC<{ children: React.ReactNode }> = (
  { children }
) => {
  return (
    <ContainerContext.Provider 
      value={new HashGridElementContainer(hashGrid)}
    >
      {children}
    </ContainerContext.Provider>
  )
}

export default ElementContainerProvider
