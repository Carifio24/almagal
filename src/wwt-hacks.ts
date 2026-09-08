// @ts-nocheck

import { Color, Matrix3d, RenderContext, Vector3d } from "@wwtelescope/engine";
import { WEBGL } from "./webgl_constants";
import { CircleShader } from "./shaders";

export function drawPointList(renderContext: RenderContext, opacity: number, cull: boolean, depthMask=false) {
  this._initBuffer(renderContext);
  const gl = renderContext.gl as WebGLRenderingContextBase;
  const originalDepthMask = gl.getParameter(WEBGL.DEPTH_WRITEMASK);
  gl.depthMask(depthMask);
  const zero = new Vector3d();
  const matInv = Matrix3d.multiplyMatrix(renderContext.get_world(), renderContext.get_view());
  matInv.invert();
  const cam = Vector3d._transformCoordinate(zero, matInv);
  for (const buffer of this._pointBuffers) {
    CircleShader.use(
      renderContext,
      buffer.vertexBuffer,
      Color.fromArgb(255 * opacity, 255, 255, 255),
      this.depthBuffered,
      this.jNow,
      0,
      cam,
      this.scale * renderContext.height / 960,
      this.minSize,
      this.showFarSide,
      this.sky,
      this._masked ? this._mask.buffer : null,
    );
    gl.drawArrays(WEBGL.POINTS, 0, buffer.count);
  }
  gl.depthMask(originalDepthMask);
}
