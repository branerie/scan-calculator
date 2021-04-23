import { click, matchSnapshot, moveMouse, pressEnter, selectDrawingTool } from "../utils/canvas"
import { visitPage } from "../utils/main"


/* eslint-disable no-undef */
describe('Canvas.line', () => {
    beforeEach(() => {
        visitPage('/')
    })

    afterEach(() => {
        matchSnapshot()
    })

    it('should draw polylines correctly', () => {
        selectDrawingTool('polyline')
    
        click(20, 20)
        click(40, 80)
        click(30, 100)
        click(30, 200)
        click(150, 220)
    
        // press enter to finish drawing polyline
        pressEnter()

        selectDrawingTool('polyline')

        click(300, 380)
        click(420, 480)
        click(480, 600)
        click(550, 450)
        click(300, 380)
        
        pressEnter()
    })

    it('should edit polyline by clicking endpoints', () => {
        selectDrawingTool('polyline')

        click(100, 100)
        click(120, 140)
        click(50, 200)
        click(100, 150)
        click(20, 50)

        pressEnter()

        click(50, 200)
        click(50, 200)
        click(300, 350)

        click(20, 50)
        click(200, 500)

        click(120, 140)
    })

    it('should edit polyline by clicking midpoint', () => {
        selectDrawingTool('polyline')

        click(100, 100)
        click(200, 200)
        click(100, 300)

        pressEnter()

        click(150, 150)
        click(150, 150)
        click(400, 150)

        click(275, 250)
        click(450, 250)
    })

    it('should edit closed polyline by clicking endpoints and midpoints', () => {
        selectDrawingTool('polyline')

        click(100, 100)
        click(200, 100)
        click(200, 200)
        click(100, 200)
        click(100, 100)

        pressEnter()

        // modify endpoint
        click(200, 200)
        click(200, 200)
        click(300, 400)

        // modify midpoint
        click(100, 150)
        click(400, 180)
    })

    it('should display snap between lines correctly', () => {
        selectDrawingTool('polyline')

        click(100, 100)
        click(200, 100)
        click(200, 200)

        pressEnter()

        selectDrawingTool('line')

        moveMouse(203, 96)
    })

    it('should display endpoint snap correctly', () => {
        selectDrawingTool('polyline')

        click(100, 100)
        click(200, 100)
        click(200, 200)

        pressEnter()

        selectDrawingTool('line')

        moveMouse(203, 196)
    })

    it('should display midpoint snap correctly', () => {
        selectDrawingTool('polyline')

        click(100, 100)
        click(200, 100)
        click(200, 200)

        pressEnter()

        selectDrawingTool('line')

        moveMouse(155, 102)
    })
})