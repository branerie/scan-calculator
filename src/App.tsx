import Canvas from './components/Canvas/index'
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
