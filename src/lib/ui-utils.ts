export function getRandomInt(min: number, max: number) {
  const minCeil = Math.ceil(min)
  const maxFloor = Math.floor(max)
  return Math.floor(Math.random() * (maxFloor - minCeil) + minCeil)
}

export function randomPointWithinSVG(
  svg?: SVGSVGElement,
  shape?: SVGPathElement,
  svgBbox?: DOMRect
) {
  if (!svg || !(svg instanceof SVGSVGElement) || !(shape instanceof SVGPathElement)) {
    return
  }

  const ctx = document.createElement('canvas').getContext('2d')
  const path = new Path2D(shape.getAttribute('d')!)

  // console.log(shape, svgBbox, shape.getBBox())

  // bbox = bbox ?? shape.getBBox()
  const bbox = shape.getBBox()

  let point = svg.createSVGPoint()
  let bPoint = svg.createSVGPoint()
  let tries = 1
  // do {
  //   point.x = getRandomInt(bbox.x, bbox.x + bbox.width)
  //   point.y = getRandomInt(bbox.y, bbox.y + bbox.height)
  //   tries++
  // } while (!shape.isPointInFill(point) || !ctx?.isPointInPath(path, point.x, point.y))
  do {
    point.x = getRandomInt(bbox.x, bbox.x + bbox.width)
    point.y = getRandomInt(bbox.y, bbox.y + bbox.height)
    bPoint.x = point.x + 200
    bPoint.y = point.y + 80
    tries++
  } while (!shape.isPointInFill(point) || !shape.isPointInFill(bPoint))

  // console.log(
  //   'before',
  //   shape.isPointInFill(point),
  //   shape.isPointInFill(bPoint),
  //   // svgBbox,
  //   tries,
  //   // bbox,
  //   point
  // )
  // console.log(
  //   tries,
  //   shape.isPointInFill(point),
  //   ctx?.isPointInPath(path, point.x, point.y),
  //   // svgBbox,
  //   // bbox,
  //   // { x: bPoint.x - 200, y: bPoint.y - 80 },
  //   point
  // )
  // // Translate the point to the actual system coordinates
  // const xPercentage = point.x / bbox.width
  // const yPercentage = point.y / bbox.height

  // // // Add the system position
  // // point.x = svgBbox.x + (svgBbox?.width ?? 1) * xPercentage
  // // point.y = svgBbox.y + (svgBbox?.height ?? 1) * yPercentage

  // // console.log(
  // //   tries,
  // //   shape.isPointInFill(point),
  // //   ctx?.isPointInPath(path, point.x, point.y),
  // //   // svgBbox,
  // //   // bbox,
  // //   // { x: bPoint.x - 200, y: bPoint.y - 80 },
  // //   point
  // // )

  return point
}
