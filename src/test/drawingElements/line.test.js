import Line from '../../drawingElements/line'
import Point from '../../drawingElements/point'
import { SELECT_DELTA } from '../../utils/constants'

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
    
    describe('checkIfPointOnElement', () => {
        it('should return true when point is close to line', () => {
            const line = new Line(new Point(100, 100), { pointB: new Point(200, 100) })
            const pointOnLine = new Point(130, 100)
            const pointCloseToLine = new Point(130, 103)
            
            expect(line.checkIfPointOnElement(pointOnLine, SELECT_DELTA)).toEqual(true)
            expect(line.checkIfPointOnElement(pointCloseToLine, SELECT_DELTA)).toEqual(true)
            expect(line.checkIfPointOnElement(line.pointA, SELECT_DELTA)).toEqual(true)
            expect(line.checkIfPointOnElement(line.pointB, SELECT_DELTA)).toEqual(true)
        })
        
        it('should return false when point is outside SELECT_DELTA range', () => {
            const line = new Line(new Point(100, 100), { pointB: new Point(200, 100) })
            const point1 = new Point(130, 104)
            const point2 = new Point(130, 96)
            const point3 = new Point(96, 100)
            const point4 = new Point(100, 104)

            expect(line.checkIfPointOnElement(point1, SELECT_DELTA)).toEqual(false)
            expect(line.checkIfPointOnElement(point2, SELECT_DELTA)).toEqual(false)
            expect(line.checkIfPointOnElement(point3, SELECT_DELTA)).toEqual(false)
            expect(line.checkIfPointOnElement(point4, SELECT_DELTA)).toEqual(false)
        })
    })

    describe('setLastAttribute', () => {
        it('should set pointB correctly', () => {
            const line = new Line(new Point(100, 100))
            line.setLastAttribute(50, 60)
            
            expect(line.pointB.x).toEqual(50)
            expect(line.pointB.y).toEqual(60)
        })
    })
    
    describe('setPointById', () => {
        it('should change coordinates of the point correctly', () => {
            const pointA = new Point(100, 100)
            pointA.pointId = 1
            const pointB = new Point(200, 100)
            pointB.pointId = 2

            const line = new Line(pointA, { pointB })
            expect(line.setPointById(1, 50, 60)).toEqual(true)
            expect(line.setPointById(2, 70, 80)).toEqual(true)
            
            expect(line.pointA.x).toEqual(50)
            expect(line.pointA.y).toEqual(60)
            expect(line.pointB.x).toEqual(70)
            expect(line.pointB.y).toEqual(80)
        })

        it('should return false if point does not exist', () => {
            const pointA = new Point(100, 100)
            pointA.pointId = 1
            const pointB = new Point(200, 100)
            pointB.pointId = 2

            const line = new Line(pointA, { pointB })

            expect(line.setPointById(3, 500, 500)).toEqual(false)
        })
    })
    
    describe('getPointById', () => {
        it('should give correct point', () => {
            const pointA = new Point(100, 200)
            pointA.pointId = 1
            const pointB = new Point(300, 400)
            pointB.pointId = 2
            const line = new Line(pointA, { pointB })
            
            expect(line.getPointById(1)).toEqual({ x: 100, y: 200, pointId: 1 })
            expect(line.getPointById(2)).toEqual({ x: 300, y: 400, pointId: 2 })
        })

        it('should return null if point does not exist', () => {
            const pointA = new Point(100, 100)
            pointA.pointId = 1
            const pointB = new Point(200, 100)
            pointB.pointId = 2

            const line = new Line(pointA, { pointB })
            expect(line.getPointById(3)).toEqual(null)
        })
    })
    
    describe('getSelectionPoints', () => {
        it('should give correct selection points', () => {
            const line = new Line(new Point(100, 100), { pointB: new Point(200, 200) })
            
            expect(line.getSelectionPoints()).toEqual([
                { x: 100, y: 100, pointType: 'endPoint' },
                { x: 200, y: 200, pointType: 'endPoint' },
                { ...line.midPoint, pointType: 'midPoint' }
            ])
        })
    })
    
    describe('defineNextAttribute', () => {
        it('should set pointB correctly', () => {
            const line = new Line(new Point(100, 100))
            line.defineNextAttribute(new Point(50, 60))
            
            expect(line.pointB.x).toEqual(50)
            expect(line.pointB.y).toEqual(60)
        })
    })
    
    describe('getNearestPoint', () => {
        it('should return nearest point on horizontal and vertical line', () => {
            const verticalLine = new Line(new Point(100, 100), { pointB: new Point(100, 200) })
            const horizontalLine = new Line(new Point(100, 100), { pointB: new Point(200, 100) })
            const point1 = new Point(50, 50)
            const point2 = new Point(120, 150)
            const point3 = new Point(250, 250)
            
            expect(horizontalLine.getNearestPoint(point1)).toEqual({ x: 100, y: 100 })
            expect(horizontalLine.getNearestPoint(point2)).toEqual({ x: 120, y: 100 })
            expect(horizontalLine.getNearestPoint(point3)).toEqual({ x: 200, y: 100 })
            expect(verticalLine.getNearestPoint(point1)).toEqual({ x: 100, y: 100 })
            expect(verticalLine.getNearestPoint(point2)).toEqual({ x: 100, y: 150 })
            expect(verticalLine.getNearestPoint(point3)).toEqual({ x: 100, y: 200 })
        })
        
        it('should return nearest point on slanted line', () => {
            const line = new Line(new Point(100, 100), { pointB: new Point(200, 200) })
            const point1 = new Point(50, 50)
            const point2 = new Point(100, 200)
            const point3 = new Point(250, 250)
            
            expect(line.getNearestPoint(point1)).toEqual({ x: 100, y: 100 })
            expect(line.getNearestPoint(point2)).toEqual({ x: 150, y: 150 })
            expect(line.getNearestPoint(point3)).toEqual({ x: 200, y: 200 })
        })
        
        it('should return nearest point on extension of horizontal and vertical line', () => {
            const verticalLine = new Line(new Point(100, 100), { pointB: new Point(100, 200) })
            const horizontalLine = new Line(new Point(100, 100), { pointB: new Point(200, 100) })
            const point1 = new Point(50, 50)
            const point2 = new Point(250, 250)
            
            expect(horizontalLine.getNearestPoint(point1, true)).toEqual({ x: 50, y: 100 })
            expect(horizontalLine.getNearestPoint(point2, true)).toEqual({ x: 250, y: 100 })
            expect(verticalLine.getNearestPoint(point1, true)).toEqual({ x: 100, y: 50 })
            expect(verticalLine.getNearestPoint(point2, true)).toEqual({ x: 100, y: 250 })
        })
        
        it('should return nearest point on extension of slanted line', () => {
            const line = new Line(new Point(100, 100), { pointB: new Point(200, 200) })
            const point1 = new Point(0, 100)
            const point2 = new Point(200, 300)
            
            expect(line.getNearestPoint(point1, true)).toEqual({ x: 50, y: 50 })
            expect(line.getNearestPoint(point2, true)).toEqual({ x: 250, y: 250 })
        })
    })
    
    describe('setLength', () => {
        it('should set length by moving pointB for horizontal and vertical line', () => {
            const verticalLine = new Line(new Point(100, 100), { pointB: new Point(100, 200) })
            const horizontalLine = new Line(new Point(100, 100), { pointB: new Point(200, 100) })
            verticalLine.setLength(50, false)
            horizontalLine.setLength(50, false)

            expect(verticalLine.length).toEqual(50)
            expect(verticalLine.pointB).toEqual({ x: 100, y: 150 })
            expect(horizontalLine.length).toEqual(50)
            expect(horizontalLine.pointB).toEqual({ x: 150, y: 100 })
        })

        it('should set length by moving pointA for horizontal and vertical line', () => {
            const verticalLine = new Line(new Point(100, 100), { pointB: new Point(100, 200) })
            const horizontalLine = new Line(new Point(100, 100), { pointB: new Point(200, 100) })
            verticalLine.setLength(50, true)
            horizontalLine.setLength(50, true)

            expect(verticalLine.length).toEqual(50)
            expect(verticalLine.pointA).toEqual({ x: 100, y: 150 })
            expect(horizontalLine.length).toEqual(50)
            expect(horizontalLine.pointA).toEqual({ x: 150, y: 100 })
        })

        it('should set length by moving correct point for slanted line', () => {
            const line = new Line(new Point(10, 10), { pointB: new Point(40, 50) })
            line.setLength(100, false)
            line.setLength(50, true)

            expect(Math.round(line.length)).toEqual(50)
            expect(Math.round(line.pointA.x)).toEqual(40)
            expect(Math.round(line.pointA.y)).toEqual(50)
            expect(Math.round(line.pointB.x)).toEqual(70)
            expect(Math.round(line.pointB.y)).toEqual(90)
        })
    })

    describe('move', () => {
        it('should move all points', () => {
            const line = new Line(new Point(100, 100), { pointB: new Point(200, 200) })
            line.move(10, 20)

            expect(line.pointA).toEqual({ x: 110, y: 120 })
            expect(line.pointB).toEqual({ x: 210, y: 220 })
            expect(line.midPoint.x).toEqual(160)
            expect(line.midPoint.y).toEqual(170)
        }) 
    })
})