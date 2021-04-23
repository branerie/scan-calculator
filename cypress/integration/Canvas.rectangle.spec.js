import { click, matchSnapshot, moveMouse, pressEscape, selectDrawingTool } from "../utils/canvas"
import { visitPage } from "../utils/main"

/* eslint-disable no-undef */
describe('<Canvas />', () => {
    beforeEach(() => {
        visitPage('/')
    })

    afterEach(() => {
        matchSnapshot()
    })

    it('should draw rectangle correctly', () => {
        selectDrawingTool('rectangle')
    
        click(100, 100)
        click(400, 200)
    
        click(400, 700)
        click(250, 500)
    })

    it('should modify rectangle by clicking midpoint', () => {
        selectDrawingTool('rectangle')

        click(100, 100)
        click(400, 200)

        pressEscape()

        // select rectangle
        click(150, 100)

        click(250, 200)
        click(250, 400)

        click(400, 250)
        click(550, 600)
    })

    it('should modify rectangle by clicking endpoint', () => {
        selectDrawingTool('rectangle')

        click(100, 100)
        click(400, 200)

        pressEscape()

        // select rectangle
        click(150, 100)

        click(400, 200)
        click(500, 300)

        click(100, 200)
        click(160, 480)

        click(400, 100)
        click(180, 290)
    })

    it('should display edge snap correctly', () => {
        selectDrawingTool('rectangle')

        click(100, 100)
        click(400, 200)

        moveMouse(403, 196)
    })

    it('should display midpoint snap correctly', () => {
        selectDrawingTool('rectangle')

        click(100, 100)
        click(400, 200)

        moveMouse(247, 104)
    })
})