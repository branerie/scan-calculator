import React from 'react'
import Canvas from './components/Canvas'
import AppContextProvider from './contexts/AppContext'

const App = () => {
    return (
        <AppContextProvider>
            <Canvas />
        </AppContextProvider>
    )
}

export default App
