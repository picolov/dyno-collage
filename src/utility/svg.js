const { Resvg } = require('@resvg/resvg-js');
export function renderSVGToImage(svgData) {
    const resvg = new Resvg(svgData, {
        fitTo: {
            mode: 'original'
        },
        background: 'white',
    });
    const pngData = resvg.render();
    return pngData.asPng();
}
export function getSVGDimensions(svgData) {
    let width, height;
    const viewBoxMatch = svgData.match(/viewBox=["'](\d+)\s+(\d+)\s+(\d+)\s+(\d+)["']/i);
    if (viewBoxMatch) {
        // viewBox format: x y width height
        width = parseInt(viewBoxMatch[3]);
        height = parseInt(viewBoxMatch[4]);
    }
    return { width, height };
}