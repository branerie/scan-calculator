import React from 'react'

const Navbar = ({ tool, setTool, undo, redo, setNextGroupId }) => {
    return (
        <>
            <div>
                {/* <input
                    type='radio'
                    id='selection'
                    checked={tool === 'selection'}
                    onChange={() => setTool('selection')}
                /> */}
                {/* <label htmlFor='selection'>Selection</label> */}
                <label htmlFor='line'>Line</label>
                <input
                    type='radio'
                    id='line'
                    checked={tool.name === 'line'}
                    onChange={() => setTool({ type: 'draw', name: 'line' })}
                />

                <label htmlFor='line'>Polyline</label>
                <input
                    type='radio'
                    id='polyline'
                    checked={tool.name === 'polyline'}
                    onChange={() => {
                        setTool({ type: 'draw', name: 'polyline' })
                        setNextGroupId()
                    }}
                />

                <label htmlFor='arc'>Arc</label>
                <input
                    type='radio'
                    id='arc'
                    checked={tool.name === 'arc'}
                    onChange={() => setTool({ type: 'draw', name: 'arc' })}
                />
            </div>
            {/* <div>
                <button onClick={undo}>Undo</button>
                <button onClick={redo}>Redo</button>
            </div> */}
        </>
    )
}

export default Navbar
