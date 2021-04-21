import Line from '../../drawingElements/line'
import Point from '../../drawingElements/point'

describe('line', () => {
    describe('length', () => {
        it('should give correct length for vertical and horizontal lines', () => {
            const verticalLine = new Line(new Point(100, 100), { pointB: new Point(100, 200) })
            const horizontalLine = new Line(new Point(100, 100), { pointB: new Point(200, 100) })

            expect(verticalLine.length).toEqual(100)
            expect(horizontalLine.length).toEqual(100)
        })

        it('should give correct length for slanted line', () => {
            const line = new Line(new Point(100, 100), { pointB: new Point(150, 150) })

            expect(line.length).toEqual(Math.sqrt(2 * 50 ** 2))
        })
    })

    describe('angle', () => {
        it('should give correct angle for vertical and horizontal lines', () => {
            const lineAngle0 = new Line(new Point(100, 100), { pointB: new Point(200, 100) })
            const lineAngle90 = new Line(new Point(100, 100), { pointB: new Point(100, 200) })
            const lineAngle180 = new Line(new Point(100, 100), { pointB: new Point(50, 100) })
            const lineAngle270 = new Line(new Point(100, 100), { pointB: new Point(100, 50) })

            expect(lineAngle0.angle).toEqual(0)
            expect(lineAngle90.angle).toEqual(90)
            expect(lineAngle180.angle).toEqual(180)
            expect(lineAngle270.angle).toEqual(270)
        })

        it('should give correct angle for slanted line', () => {
            const lineQuadrant1 = new Line(new Point (100, 100), { pointB: new Point(200, 200) })
            const lineQuadrant2 = new Line(new Point (0, 0), { pointB: new Point(-100, 100) })
            const lineQuadrant3 = new Line(new Point (0, 0), { pointB: new Point(-100, -100) })
            const lineQuadrant4 = new Line(new Point (100, 100), { pointB: new Point(200, 0) })

            expect(lineQuadrant1.angle).toEqual(45) 
            expect(lineQuadrant2.angle).toEqual(135) 
            expect(lineQuadrant3.angle).toEqual(225) 
            expect(lineQuadrant4.angle).toEqual(315) 
        })
    })
})