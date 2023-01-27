import { useToolsStore } from '../../stores/tools/index'

const Navbar = () => {
  const toolsStore = useToolsStore()
  const tool = toolsStore(state => state.tool)
  const setTool = toolsStore(state => state.setTool)
  const options = toolsStore(state => state.options)
  const toggleOption = toolsStore(state => state.toggleOption)

  return (<>
    <div>
      <label>
        Select
        <input
          type='radio'
          name='select'
          checked={tool.name === 'select'}
          onChange={() => setTool({ type: 'select', name: 'select' })}
        />
      </label>
      <label>
        Line
        <input
          type='radio'
          name='line'
          checked={tool.name === 'line'}
          onChange={() => setTool({ type: 'draw', name: 'line' })}
        />
      </label>

      <label>
        Polyline
        <input
          type='radio'
          name='polyline'
          checked={tool.name === 'polyline'}
          onChange={() => setTool({ type: 'draw', name: 'polyline' })}
        />
      </label>

      <label>
        Arc
        <input
          type='radio'
          name='arc'
          checked={tool.name === 'arc'}
          onChange={() => setTool({ type: 'draw', name: 'arc' })}
        />
      </label>
      <label>
        Circle
        <input
          type='radio'
          name='circle'
          checked={tool.name === 'circle'}
          onChange={() => setTool({ type: 'draw', name: 'circle' })}
        />
      </label>
      <label>
        Rectangle
        <input
          type='radio'
          name='rectangle'
          checked={tool.name === 'rectangle'}
          onChange={() => setTool({ type: 'draw', name: 'rectangle' })}
        />
      </label>
      <label>
        Snapping
        <input
          type='checkbox'
          name='snapping'
          checked={options.snap}
          onChange={() => toggleOption('snap')}
        />
      </label>
      <label>
        Ortho
        <input
          type='checkbox'
          name='ortho'
          checked={options.ortho}
          onChange={() => toggleOption('ortho')}
        />
      </label>
      <label>
        Move
        <input
          type='radio'
          name='move'
          checked={tool.name === 'move'}
          onChange={() => setTool({ type: 'transform', name: 'move' })}
        />
      </label>
      <label>
        Rotate
        <input
          type='radio'
          name='rotate'
          checked={tool.name === 'rotate'}
          onChange={() => setTool({ type: 'transform', name: 'rotate' })}
        />
      </label>
      <label>
        Mirror
        <input
          type='radio'
          name='mirror'
          checked={tool.name === 'mirror'}
          onChange={() => setTool({ type: 'transform', name: 'mirror' })}
        />
      </label>
      <label>
        Scale
        <input
          type='radio'
          name='scale'
          checked={tool.name === 'scale'}
          onChange={() => setTool({ type: 'transform', name: 'scale' })}
        />
      </label>
      <label>
        Copy
        <input
          type='radio'
          name='copy'
          checked={tool.name === 'copy'}
          onChange={() => setTool({ type: 'copy', name: 'copy' })}
        />
      </label>
      <label>
        Trim
        <input
          type='radio'
          name='trim'
          checked={tool.name === 'trim'}
          onChange={() => setTool({ type: 'trim', name: 'trim' })}
        />
      </label>
      <label>
        Extend
        <input
          type='radio'
          name='trim'
          checked={tool.name === 'extend'}
          onChange={() => setTool({ type: 'trim', name: 'extend' })}
        />
      </label>
    </div>
    {/* <div>
      <button onClick={undo}>Undo</button>
      <button onClick={redo}>Redo</button>
    </div> */}
  </>)
}

export default Navbar
