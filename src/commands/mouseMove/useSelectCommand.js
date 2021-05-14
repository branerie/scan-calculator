import { useCallback } from 'react'
import { useToolsContext } from '../../contexts/ToolsContext'

const useSelectCommand = () => {
    const { tool, setTool } = useToolsContext()

    const handleSelectCmd = useCallback((mousePosition) => {
        setTool({ ...tool, mousePosition })
    }, [tool, setTool])

    return handleSelectCmd
}

export default useSelectCommand