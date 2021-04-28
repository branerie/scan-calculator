import React, { useState, useContext, createContext } from 'react'

const Context = createContext()

export function useToolsContext() {
    return useContext(Context)
}

export default function ToolsContextProvider({ children }) {
    const [currentTranslate, setCurrentTranslate] = useState([0, 0])
    const [currentScale, setCurrentScale] = useState(1)
    const [tool, setTool] = useState({ type: 'select', name: 'select' })

    return (
        <Context.Provider value={{
            currentTranslate,
            setCurrentTranslate,
            currentScale,
            setCurrentScale,
            tool,
            setTool,
        }}>
            {children}
        </Context.Provider>
    )
}


