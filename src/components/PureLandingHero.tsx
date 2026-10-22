import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface PureLandingHeroProps {
  onContinue: () => void;
}

const DISCIPLINES = [
  '端侧推理优化',
  '系统级 AI 产品',
  '商业产品闭环',
  '文化遗产 3D 数字化',
];

const VERTEX_SHADER = `#define PHONG

vec3 mod289(vec3 x)
{
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 mod289(vec4 x)
{
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 permute(vec4 x)
{
  return mod289(((x*34.0)+1.0)*x);
}

vec4 taylorInvSqrt(vec4 r)
{
  return 1.79284291400159 - 0.85373472095314 * r;
}

vec3 fade(vec3 t) {
  return t*t*t*(t*(t*6.0-15.0)+10.0);
}

float cnoise(vec3 P)
{
  vec3 Pi0 = floor(P);
  vec3 Pi1 = Pi0 + vec3(1.0);
  Pi0 = mod289(Pi0);
  Pi1 = mod289(Pi1);
  vec3 Pf0 = fract(P);
  vec3 Pf1 = Pf0 - vec3(1.0);
  vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
  vec4 iy = vec4(Pi0.yy, Pi1.yy);
  vec4 iz0 = Pi0.zzzz;
  vec4 iz1 = Pi1.zzzz;

  vec4 ixy = permute(permute(ix) + iy);
  vec4 ixy0 = permute(ixy + iz0);
  vec4 ixy1 = permute(ixy + iz1);

  vec4 gx0 = ixy0 * (1.0 / 7.0);
  vec4 gy0 = fract(floor(gx0) * (1.0 / 7.0)) - 0.5;
  gx0 = fract(gx0);
  vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
  vec4 sz0 = step(gz0, vec4(0.0));
  gx0 -= sz0 * (step(0.0, gx0) - 0.5);
  gy0 -= sz0 * (step(0.0, gy0) - 0.5);

  vec4 gx1 = ixy1 * (1.0 / 7.0);
  vec4 gy1 = fract(floor(gx1) * (1.0 / 7.0)) - 0.5;
  gx1 = fract(gx1);
  vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
  vec4 sz1 = step(gz1, vec4(0.0));
  gx1 -= sz1 * (step(0.0, gx1) - 0.5);
  gy1 -= sz1 * (step(0.0, gy1) - 0.5);

  vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);
  vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
  vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);
  vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
  vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);
  vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
  vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);
  vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);

  vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
  g000 *= norm0.x;
  g010 *= norm0.y;
  g100 *= norm0.z;
  g110 *= norm0.w;
  vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
  g001 *= norm1.x;
  g011 *= norm1.y;
  g101 *= norm1.z;
  g111 *= norm1.w;

  float n000 = dot(g000, Pf0);
  float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
  float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
  float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
  float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
  float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
  float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
  float n111 = dot(g111, Pf1);

  vec3 fade_xyz = fade(Pf0);
  vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
  vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
  float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x);
  return 2.2 * n_xyz;
}

float pnoise(vec3 P, vec3 rep)
{
  vec3 Pi0 = mod(floor(P), rep);
  vec3 Pi1 = mod(Pi0 + vec3(1.0), rep);
  Pi0 = mod289(Pi0);
  Pi1 = mod289(Pi1);
  vec3 Pf0 = fract(P);
  vec3 Pf1 = Pf0 - vec3(1.0);
  vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
  vec4 iy = vec4(Pi0.yy, Pi1.yy);
  vec4 iz0 = Pi0.zzzz;
  vec4 iz1 = Pi1.zzzz;

  vec4 ixy = permute(permute(ix) + iy);
  vec4 ixy0 = permute(ixy + iz0);
  vec4 ixy1 = permute(ixy + iz1);

  vec4 gx0 = ixy0 * (1.0 / 7.0);
  vec4 gy0 = fract(floor(gx0) * (1.0 / 7.0)) - 0.5;
  gx0 = fract(gx0);
  vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
  vec4 sz0 = step(gz0, vec4(0.0));
  gx0 -= sz0 * (step(0.0, gx0) - 0.5);
  gy0 -= sz0 * (step(0.0, gy0) - 0.5);

  vec4 gx1 = ixy1 * (1.0 / 7.0);
  vec4 gy1 = fract(floor(gx1) * (1.0 / 7.0)) - 0.5;
  gx1 = fract(gx1);
  vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
  vec4 sz1 = step(gz1, vec4(0.0));
  gx1 -= sz1 * (step(0.0, gx1) - 0.5);
  gy1 -= sz1 * (step(0.0, gy1) - 0.5);

  vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);
  vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
  vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);
  vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
  vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);
  vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
  vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);
  vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);

  vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
  g000 *= norm0.x;
  g010 *= norm0.y;
  g100 *= norm0.z;
  g110 *= norm0.w;
  vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
  g001 *= norm1.x;
  g011 *= norm1.y;
  g101 *= norm1.z;
  g111 *= norm1.w;

  float n000 = dot(g000, Pf0);
  float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
  float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
  float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
  float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
  float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
  float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
  float n111 = dot(g111, Pf1);

  vec3 fade_xyz = fade(Pf0);
  vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
  vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
  float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x);
  return 2.2 * n_xyz;
}

float turbulence(vec3 p) {
  float w = 100.0;
  float t = -.5;
  for (float f = 1.0 ; f <= 10.0 ; f++) {
    float power = pow(2.0, f);
    t += abs(pnoise(vec3(power * p), vec3(10.0, 10.0, 10.0)) / power);
  }
  return t;
}

uniform float time;
varying vec2 vUv;
varying float noise;

varying vec3 vViewPosition;

#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>

void main() {

	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>

	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>

	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>

	vViewPosition = - mvPosition.xyz;

	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>

  vUv = uv;

  noise = turbulence(0.01 * position + normal + time * 0.8);
  vec3 displacement = vec3((position.x) * noise, position.y * noise, position.z * noise);
  gl_Position = projectionMatrix * modelViewMatrix * vec4((position + normal) + displacement, 1.0);
}
`;

const FRAGMENT_SHADER = `#define PHONG

uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;

uniform float time;
varying vec2 vUv;
varying vec3 newPosition;
varying float noise;

#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>

void main() {

	#include <clipping_planes_fragment>

  vec3 color = vec3(vUv * (0.2 - 2.0 * noise), 1.0);
  vec3 finalColors = vec3(color.b * 1.5, color.r, color.r);
  vec4 diffuseColor = vec4(cos(finalColors * noise * 3.0), 1.0);
  ReflectedLight reflectedLight = ReflectedLight(vec3(0.0), vec3(0.0), vec3(0.0), vec3(0.0));
  vec3 totalEmissiveRadiance = emissive;

	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>

	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>

	#include <aomap_fragment>

	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;

	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>

  gl_FragColor = vec4(outgoingLight, diffuseColor.a);
}
`;

export const PureLandingHero: React.FC<PureLandingHeroProps> = ({
  onContinue,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [wordText, setWordText] = useState<string>(DISCIPLINES[0]);
  const [animatingBlock, setAnimatingBlock] = useState<boolean>(false);
  const [isPressed, setIsPressed] = useState<boolean>(false);
  const transitioningRef = useRef<boolean>(false);

  // 1. Blue Block Reveal Wipe cycle
  useEffect(() => {
    let idx = 0;
    let swapTimer: number | undefined;
    const interval = window.setInterval(() => {
      idx = (idx + 1) % DISCIPLINES.length;
      const nextWord = DISCIPLINES[idx];
      setAnimatingBlock(false);
      requestAnimationFrame(() => {
        setAnimatingBlock(true);
      });
      swapTimer = window.setTimeout(() => {
        setWordText(nextWord);
      }, 550);
    }, 3800);

    return () => {
      window.clearInterval(interval);
      if (swapTimer) window.clearTimeout(swapTimer);
    };
  }, []);

  // 2. Press any key or click to continue into Planetary Navigation
  useEffect(() => {
    const triggerContinue = () => {
      if (transitioningRef.current) return;
      transitioningRef.current = true;
      setIsPressed(true);
      window.setTimeout(() => {
        onContinue();
      }, 240);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore standalone modifier keys if needed, or any key continues
      if (['Shift', 'Control', 'Alt', 'Meta'].includes(e.key)) {
        triggerContinue();
        return;
      }
      triggerContinue();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onContinue]);

  // 3. Three.js 3D DisplacementSphere
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let width = window.innerWidth;
    let height = window.innerHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(54, width / height, 0.1, 100);
    camera.position.z = 52;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      });
    } catch {
      return;
    }

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const dirLight = new THREE.DirectionalLight(0xffffff, 2.0);
    dirLight.position.set(100, 100, 200);
    scene.add(dirLight);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    let shaderUniforms: Record<string, { value: number }> | null = null;
    const material = new THREE.MeshPhongMaterial();
    material.onBeforeCompile = (shader) => {
      const merged = THREE.UniformsUtils.merge([
        shader.uniforms,
        { time: { value: 0 } },
      ]);
      shader.uniforms = merged;
      shaderUniforms = merged;
      shader.vertexShader = VERTEX_SHADER;
      shader.fragmentShader = FRAGMENT_SHADER;
    };

    const geometry = new THREE.SphereGeometry(32, 128, 128);
    const sphere = new THREE.Mesh(geometry, material);

    const updateSpherePosition = () => {
      const w = window.innerWidth;
      if (w <= 696) {
        sphere.position.set(14, 10, 0);
      } else if (w <= 1040) {
        sphere.position.set(18, 14, 0);
      } else {
        sphere.position.set(22, 16, 0);
      }
    };
    updateSpherePosition();
    scene.add(sphere);

    let targetRotX = 0;
    let targetRotY = 0;
    let currentRotX = 0;
    let currentRotY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const x = e.clientX / window.innerWidth;
      const y = e.clientY / window.innerHeight;
      targetRotX = y / 2;
      targetRotY = x / 2;
    };

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      updateSpherePosition();
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', handleResize);

    const startTime = Date.now();
    let animId = 0;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      if (shaderUniforms && shaderUniforms.time) {
        shaderUniforms.time.value = 0.00005 * (Date.now() - startTime);
      }
      currentRotX += (targetRotX - currentRotX) * 0.05;
      currentRotY += (targetRotY - currentRotY) * 0.05;

      sphere.rotation.z += 0.001;
      sphere.rotation.x = currentRotX;
      sphere.rotation.y = currentRotY;

      renderer.render(scene, camera);
    };
    animId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, []);

  const handlePromptClick = () => {
    if (transitioningRef.current) return;
    transitioningRef.current = true;
    setIsPressed(true);
    window.setTimeout(() => {
      onContinue();
    }, 220);
  };

  return (
    <div
      onClick={handlePromptClick}
      className="fixed inset-0 z-30 w-screen h-screen overflow-hidden bg-[#111111] text-white select-none cursor-pointer"
    >
      <canvas
        ref={canvasRef}
        className="fixed inset-0 w-screen h-screen z-[1] pointer-events-none"
      />

      <main
        className="relative z-[2] w-screen h-screen flex flex-col justify-center pr-12"
        style={{ paddingLeft: 'clamp(48px, 10vw, 160px)' }}
      >
        <div className="max-w-[1024px] relative -top-6">
          {/* 1. 殷添行 名字 */}
          <div
            className="font-hero-mono uppercase text-white/60 mb-7 leading-none font-medium"
            style={{
              fontSize: 'clamp(18px, 1.8vw, 26px)',
              letterSpacing: '0.35em',
            }}
          >
            殷添行
          </div>

          {/* 2. 主标题 + 蓝色方块划过展开切换 */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center whitespace-nowrap">
              <span
                className="font-hero-serif font-black text-white leading-[1.1]"
                style={{
                  fontSize: 'clamp(38px, 6vw, 92px)',
                  letterSpacing: '-0.03em',
                }}
              >
                AI 跨界技术人才
              </span>
              <span
                className="h-[2px] bg-white/25 ml-7"
                style={{ width: 'clamp(60px, 12vw, 200px)' }}
              />
            </div>

            <div className="flex items-center min-h-[1.25em] relative overflow-visible py-2.5">
              <div
                className="relative inline-flex items-center font-hero-serif font-black text-white leading-[1.25] whitespace-nowrap isolate"
                style={{
                  fontSize: 'clamp(36px, 5.5vw, 86px)',
                  letterSpacing: '-0.03em',
                }}
              >
                <span className="mr-4 text-white/40 font-hero-serif font-normal">
                  +
                </span>
                <span className="inline-block text-white transition-opacity duration-150">
                  {wordText}
                </span>
                <span
                  className={`absolute pointer-events-none bg-[#00e5ff] z-[2] ${
                    animatingBlock ? 'hero-word-block-animate' : ''
                  }`}
                  style={{
                    inset: '-0.08em -0.05em -0.08em 0',
                    transformOrigin: 'left',
                    transform: animatingBlock ? undefined : 'scale3d(0, 1, 1)',
                  }}
                />
              </div>
            </div>
          </div>

          <p
            className="mt-9 text-white/60 leading-[1.6] max-w-[680px]"
            style={{
              fontSize: 'clamp(15px, 1.3vw, 19px)',
              letterSpacing: '0.02em',
            }}
          >
            从商务英语走向 AI 工程与跨学科研究 | 希望参与创造 AGI | 端侧决策路由 · 联想 AI PC 语音入口 · 商业级产品闭环
          </p>

          {/* 3. 按任何键以继续 (纯文字单行无框) */}
          <div
            onClick={(e) => {
              e.stopPropagation();
              handlePromptClick();
            }}
            data-pressed={isPressed ? 'true' : undefined}
            className="mt-11 inline-flex cursor-pointer select-none w-fit group"
          >
            <span
              className={`text-[15px] font-light tracking-[0.25em] transition-colors duration-300 hero-prompt-breathe ${
                isPressed
                  ? 'text-[#00e5ff] !opacity-100'
                  : 'text-white/60 group-hover:text-[#00e5ff] group-hover:!opacity-100'
              }`}
              style={{
                fontFamily:
                  "'MiSans', -apple-system, BlinkMacSystemFont, 'PingFang SC', 'HarmonyOS Sans SC', 'Microsoft YaHei', sans-serif",
              }}
            >
              按任何键以继续
            </span>
          </div>
        </div>
      </main>
    </div>
  );
};
