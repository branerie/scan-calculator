import React, { createContext, useCallback, useContext } from 'react'
import useToolsContext from '../contextHooks/useToolsContext'
import useElementsContext from '../contextHooks/useElementsContext'

const Context = createContext()

export function useAppContext() {
    return useContext(Context)
}

export default function AppContextProvider({ children }) {
    const elementsContext = useElementsContext()
    const toolsContext = useToolsContext()

    const {
        resetCurrentModifications,
        selection: {
            clearSelection
        }
    } = elementsContext

    const {
        setTool,
    } = toolsContext

    const setNewTool = useCallback((newTool) => {
        resetCurrentModifications()

        if (newTool.type !== 'transform' && newTool.type !== 'copy' && newTool.type !== 'trim') {
            clearSelection()
        }

        setTool(newTool)
    }, [clearSelection, resetCurrentModifications, setTool])

    return (
        <Context.Provider value={{
            elements: {
                ...elementsContext,
            },
            tools: {
                ...toolsContext,
                setTool: setNewTool
            }
        }}>
            {children}
        </Context.Provider>
    )
}