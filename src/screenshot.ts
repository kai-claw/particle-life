/** Take a screenshot of the canvas and download it as PNG */
export function takeScreenshot(canvas: HTMLCanvasElement | null) {
  if (!canvas) return;
  const link = document.createElement('a');
  link.download = `particle-life-${Date.now()}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}
