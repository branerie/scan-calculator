import Canvas from './components/Canvas/index'
import AppContextProvider from './contexts/AppContext'
import ElementContainerProvider from './contexts/ElementContainerContext'
import ElementsStoreProvider from './contexts/ElementsStoreContext'

const App = () => {
  return (
    <ElementContainerProvider>
      <ElementsStoreProvider>
        <AppContextProvider>
          <Canvas />
        </AppContextProvider>
      </ElementsStoreProvider>
    </ElementContainerProvider>
  )
}

export default App
