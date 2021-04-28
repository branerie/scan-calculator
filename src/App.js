import React from 'react'
import Canvas from './components/Canvas'
import MainContextProvider from './contexts/MainContext'

const App = () => {
    return (
        <MainContextProvider>
            <Canvas/>
        </MainContextProvider>
    )
}

export default App
