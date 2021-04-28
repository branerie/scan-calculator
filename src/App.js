import React from 'react'
import Canvas from './components/Canvas'
import ElementsContextProvider from './contexts/ElementsContext'
import ToolsContextProvider from './contexts/ToolsContext'

const App = () => {
    return (
        <ToolsContextProvider>
            <ElementsContextProvider>
                <Canvas/>
            </ElementsContextProvider>
        </ToolsContextProvider>
    )
}

export default App
