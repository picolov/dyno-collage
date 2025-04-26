interface CommonCanvas {
  width: number;
  height: number;
  getContext(contextId: '2d'): any;
}

declare global {
  interface Window {
    dynoCollage: {
      generateCollage: (
        canvas: CommonCanvas,
        svgData: string
      ) => Promise<CommonCanvas>;
    };
  }
}

export function generateCollage(
  canvas: CommonCanvas,
  svgData: string
): Promise<CommonCanvas>; 