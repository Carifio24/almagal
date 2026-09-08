// @ts-nocheck

import { Color, Matrix3d, RenderContext } from "@wwtelescope/engine";
import { WEBGL } from "./webgl_constants";
import { createFragmentShader, createShader, createVertexShader, createProgram, displayProgramLinkError, displayShaderCompileError } from "./webgl_utils";

export class CircleShader {

  static initialized = false;

  static init(renderContext: RenderContext) {
    const gl: WebGLRenderingContextBase = renderContext.gl;

    const fragShaderText = `\
      precision mediump float;
      varying vec4 vColor;
      void main() {
        vec2 p = gl_PointCoord - vec2(0.5);
        float r = length(p);
        float a = smoothstep(0.50, 0.46, r);
        if (a <= 0.0) discard;
        float core = smoothstep(0.50, 0.30, r);
        vec3 col = vColor.rgb * mix(0.85, 1.15, core);
        gl_FragColor = vec4(col, a * vColor.a);
      }
    `;

    const vertShaderText = `\
      attribute vec3 aVertexPosition;
      attribute vec4 aVertexColor;
      attribute vec2 aTime;
      uniform mat4 uMVMatrix;
      uniform mat4 uPMatrix;
      uniform float jNow;
      uniform float decay;

      varying lowp vec4 vColor;

      void main(void)
      {
          gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);
          float dAlpha = 1.0;

          if (decay > 0.0)
          {
                  dAlpha = 1.0 - ((jNow - aTime.y) / decay);
                  if (dAlpha > 1.0 )
                  {
                      dAlpha = 1.0;
                  }
          }

          if (jNow < aTime.x && decay > 0.0)
          {
              vColor = vec4(1, 1, 1, 1);
          }
          else
          {
              vColor = vec4(aVertexColor.r, aVertexColor.g, aVertexColor.b, dAlpha * aVertexColor.a);
          }
      }
    `;

    const vert = createVertexShader(gl, vertShaderText);
    CircleShader._vert = vert;
    displayShaderCompileError(gl, vert);

    const frag = createFragmentShader(gl, fragShaderText);
    CircleShader._frag = frag;
    displayShaderCompileError(gl, frag);

    const program = createProgram(gl, vert, frag);
    CircleShader._prog = program;
    displayProgramLinkError(gl, program);

    gl.useProgram(program);
    CircleShader.posLoc = gl.getAttribLocation(program, "aVertexPosition");
    CircleShader.colorLoc = gl.getAttribLocation(program, "aVertexColor");
    CircleShader.timeLoc = gl.getAttribLocation(program, "aTime");
    CircleShader.mvMatrixLoc = gl.getUniformLocation(program, "uMVMatrix");
    CircleShader.pMatrixLoc = gl.getUniformLocation(program, "uPMatrix");
    CircleShader.nowLoc = gl.getUniformLocation(program, "jNow");
    CircleShader.decayLoc = gl.getUniformLocation(program, "decay");

    gl.enable(WEBGL.BLEND);
    gl.blendFunc(WEBGL.SRC_ALPHA, WEBGL.ONE_MINUS_SRC_ALPHA);
    CircleShader.initialized = true;
  }

  static use(renderContext: RenderContext,
             vertex: WebGLBuffer,
             lineColor: Color,
             zBuffer: boolean,
             jNow: number,
             decay: number,
  ) {

    const gl = renderContext.gl as WebGLRenderingContextBase;
    if (!CircleShader.initialized) {
      CircleShader.init(renderContext);
    }

    gl.useProgram(CircleShader._prog);
    const mvMat = Matrix3d.multiplyMatrix(renderContext.get_world(), renderContext.get_view());
    gl.uniformMatrix4fv(CircleShader.mvMatrixLoc, false, mvMat.floatArray());
    gl.uniformMatrix4fv(CircleShader.pMatrixLoc, false, renderContext.get_projection().floatArray());
    gl.uniform1f(CircleShader.nowLoc, jNow);
    gl.uniform1f(CircleShader.decayLoc, decay);
    if (zBuffer) {
      gl.enable(WEBGL.DEPTH_TEST);
    } else {
      gl.disable(WEBGL.DEPTH_TEST);
    }
    gl.disableVertexAttribArray(0);
    gl.disableVertexAttribArray(1);
    gl.disableVertexAttribArray(2);
    gl.disableVertexAttribArray(3);
    gl.bindBuffer(WEBGL.ARRAY_BUFFER, vertex);
    gl.bindBuffer(WEBGL.ELEMENT_ARRAY_BUFFER, null);
    gl.enableVertexAttribArray(CircleShader.vertLoc);
    gl.enableVertexAttribArray(CircleShader.colorLoc);
    gl.vertexAttribPointer(CircleShader.posLoc, 3, WEBGL.FLOAT, false, 36, 0);
    gl.vertexAttribPointer(CircleShader.colorLoc, 4, WEBGL.FLOAT, false, 36, 12);
    gl.vertexAttribPointer(CircleShader.timeLoc, 2, WEBGL.FLOAT, false, 36, 28);
    gl.lineWidth(1);
    gl.enable(WEBGL.BLEND);
    gl.blendFunc(WEBGL.SRC_ALPHA, WEBGL.ONE_MINUS_SRC_ALPHA);
  }

}
