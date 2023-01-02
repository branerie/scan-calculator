import React from 'react'
import Canvas from './components/Canvas'
import AppContextProvider from './contexts/AppContext'
import ElementContainerProvider from './contexts/ElementContainerContext'

const App = () => {
  return (
    <ElementContainerProvider>
      <AppContextProvider>
        <Canvas />
      </AppContextProvider>
    </ElementContainerProvider>
  )
}

export default App
