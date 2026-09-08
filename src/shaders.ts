// @ts-nocheck

import { CameraParameters, Color, Matrix3d, RenderContext } from "@wwtelescope/engine";
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
        float core = smoothstep(0.50, 0.30, r);
        vec3 col = vColor.rgb * mix(0.85, 1.15, core);
        gl_FragColor = vec4(col, a * vColor.a);
      }
    `;

    const vertShaderText = `\
      attribute vec3 aVertexPosition;
      attribute vec4 aVertexColor;
      attribute vec2 aTime;
      attribute float aPointSize;
      attribute float aShow;
      uniform mat4 uMVMatrix;
      uniform mat4 uPMatrix;
      uniform float jNow;
      uniform vec3 cameraPosition;
      uniform float decay;
      uniform float scale;
      uniform float minSize;
      uniform float sky;
      uniform float showFarSide;

      varying lowp vec4 vColor;

      void main(void)
      {
          float dotCam = dot( normalize(cameraPosition-aVertexPosition), normalize(aVertexPosition));
          float dist = distance(aVertexPosition, cameraPosition);
          gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);
          float dAlpha = aShow;

          if ( dAlpha > 0.0 && decay > 0.0 )
          {
                  dAlpha = 1.0 - ((jNow - aTime.y) / decay);
                  if (dAlpha > 1.0 )
                  {
                      dAlpha = 1.0;
                  }
          }

          if ( showFarSide == 0.0 && (dotCam * sky) < 0.0 || (jNow < aTime.x && decay > 0.0))
          {
              vColor = vec4(0.0, 0.0, 0.0, 0.0);
          }
          else
          {
              vColor = vec4(aVertexColor.r, aVertexColor.g, aVertexColor.b, aVertexColor.a * dAlpha);
          }

          float lSize = scale;

          if (scale < 0.0)
          {
              lSize = -scale;
              dist = 1.0;
          }

          gl_PointSize = max(minSize, (lSize * ( aPointSize ) / dist));
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
    CircleShader.pointSizeLoc = gl.getAttribLocation(program, "aPointSize");
    CircleShader.timeLoc = gl.getAttribLocation(program, "aTime");
    CircleShader.showLoc = gl.getAttribLocation(program, "aShow");
    CircleShader.mvMatrixLoc = gl.getUniformLocation(program, "uMVMatrix");
    CircleShader.pMatrixLoc = gl.getUniformLocation(program, "uPMatrix");
    CircleShader.nowLoc = gl.getUniformLocation(program, "jNow");
    CircleShader.cameraPosLoc = gl.getUniformLocation(program, "cameraPosition");
    CircleShader.decayLoc = gl.getUniformLocation(program, "decay");
    CircleShader.scaleLoc = gl.getUniformLocation(program, "scale");
    CircleShader.minSizeLoc = gl.getUniformLocation(program, "minSize");
    CircleShader.skyLoc = gl.getUniformLocation(program, "sky");
    CircleShader.showFarSideLoc = gl.getUniformLocation(program, "showFarSide");
    CircleShader.lineColorLoc = gl.getUniformLocation(program, "lineColor");

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
             camera: CameraParameters,
             scale: number,
             minSize: number,
             showFarSide: boolean,
             sky: booleam,
             mask: WebGLBuffer,
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
    gl.uniform1f(CircleShader.scaleLoc, scale);
    gl.uniform1f(CircleShader.minSizeLoc, minSize);
    gl.uniform1f(CircleShader.showFarSideLoc, showFarSide ? 1 : 0);
    gl.uniform1f(CircleShader.skyLoc, sky ? -1 : 1);
    gl.uniform3f(CircleShader.cameraPosLoc, camera.x, camera.y, camera.z);
    gl.uniform4f(CircleShader.lineColorLoc, lineColor.r / 255, lineColor.g / 255, lineColor.b / 255, lineColor.a / 255);

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
    gl.enableVertexAttribArray(CircleShader.pointSizeLoc);
    gl.enableVertexAttribArray(CircleShader.timeLoc);
    gl.vertexAttribPointer(CircleShader.vertLoc, 3, WEBGL.FLOAT, false, 40, 0);
    gl.vertexAttribPointer(CircleShader.colorLoc, 4, WEBGL.FLOAT, false, 40, 12);
    gl.vertexAttribPointer(CircleShader.pointSizeLoc, 1, WEBGL.FLOAT, false, 40, 36);
    gl.vertexAttribPointer(CircleShader.timeLoc, 2, WEBGL.FLOAT, false, 40, 28);

    if (mask != null) {
      gl.bindBuffer(WEBGL.ARRAY_BUFFER, mask);
      gl.enableVertexAttribArray(CircleShader.showLoc);
      gl.vertexAttribPointer(CircleShader.showLoc, 1, WEBGL.UNSIGNED_BYTE, false, 0, 0);
    } else {
      gl.disableVertexAttribArray(CircleShader.showLoc);
      gl.vertexAttrib1f(CircleShader.showLoc, 1.0);
    }

    gl.lineWidth(1);
    gl.enable(WEBGL.BLEND);
    gl.blendFunc(WEBGL.SRC_ALPHA, WEBGL.ONE_MINUS_SRC_ALPHA);
  }

}
