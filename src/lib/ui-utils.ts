export function getRandomInt(min: number, max: number) {
  const minCeil = Math.ceil(min)
  const maxFloor = Math.floor(max)
  return Math.floor(Math.random() * (maxFloor - minCeil) + minCeil)
}

export function randomPointWithinSVG(
  svg: SVGSVGElement,
  shape: SVGPathElement,
  bounds?: SVGPathElement
) {
  if (!(svg instanceof SVGSVGElement) || !(shape instanceof SVGPathElement)) {
    return
  }
  shape = bounds ?? shape
  const bbox = shape.getBBox()
  const matrix = shape.getScreenCTM()!

  matrix.e = parseInt(svg.style.getPropertyValue('left')?.replace(/.*?(\d+).*?/g, '$1'))
  matrix.f = parseInt(svg.style.getPropertyValue('top')?.replace(/.*?(\d+).*?/g, '$1')) + 64

  let point = svg.createSVGPoint()
  let tries = 0
  const width = 363
  const height = 149

  do {
    point.x = getRandomInt(bbox.x + width / 2, bbox.x + bbox.width - width / 2)
    point.y = getRandomInt(bbox.y + height / 2, bbox.y + bbox.height - height / 2)
    tries++
  } while (!shape.isPointInFill(point) && tries < 30)

  point = point.matrixTransform(matrix.translate(0, -128))

  return { x: point.x, y: point.y }
}
