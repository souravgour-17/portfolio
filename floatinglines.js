document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById('floating-bg');
    if (!container || typeof THREE === 'undefined') return;

    // Configuration
    const lineCount = 5;
    const lineDistance = 0.05; 
    const animationSpeed = 1.0;
    const interactive = true;
    const bendRadius = 5.0;
    const bendStrength = -0.5;
    const mouseDamping = 0.05;
    const parallax = true;
    const parallaxStrength = 0.2;

    const topWavePosition = new THREE.Vector3(10.0, 0.5, -0.4);
    const middleWavePosition = new THREE.Vector3(5.0, 0.0, 0.2);
    const bottomWavePosition = new THREE.Vector3(2.0, -0.7, 0.4);

    // Shaders
    const vertexShader = `
    precision highp float;
    void main() {
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
    `;

    const fragmentShader = `
    precision highp float;

    uniform float iTime;
    uniform vec3  iResolution;
    uniform float animationSpeed;

    uniform float lineDistance;
    uniform vec3 topWavePosition;
    uniform vec3 middleWavePosition;
    uniform vec3 bottomWavePosition;

    uniform vec2 iMouse;
    uniform bool interactive;
    uniform float bendRadius;
    uniform float bendStrength;
    uniform float bendInfluence;

    uniform bool parallax;
    uniform vec2 parallaxOffset;

    // AVENGERS THEME COLORS (Red, Dark Red, Black)
    const vec3 BLACK = vec3(0.0);
    const vec3 RED  = vec3(255.0, 10.0, 10.0) / 255.0;
    const vec3 DARK_RED  = vec3(120.0, 0.0, 0.0) / 255.0;
    
    #define LINE_COUNT 5

    mat2 rotate(float r) {
        return mat2(cos(r), sin(r), -sin(r), cos(r));
    }

    vec3 background_color(vec2 uv) {
        vec3 col = vec3(0.0);
        float y = sin(uv.x - 0.2) * 0.3 - 0.1;
        float m = uv.y - y;

        col += mix(DARK_RED, BLACK, smoothstep(0.0, 1.0, abs(m)));
        col += mix(RED, BLACK, smoothstep(0.0, 1.0, abs(m - 0.8)));
        return col * 0.5;
    }

    float wave(vec2 uv, float offset, vec2 screenUv, vec2 mouseUv, bool shouldBend) {
        float time = iTime * animationSpeed;
        float x_offset   = offset;
        float x_movement = time * 0.1;
        float amp        = sin(offset + time * 0.2) * 0.3;
        float y          = sin(uv.x + x_offset + x_movement) * amp;

        if (shouldBend) {
            vec2 d = screenUv - mouseUv;
            float influence = exp(-dot(d, d) * bendRadius); 
            float bendOffset = (mouseUv.y - screenUv.y) * influence * bendStrength * bendInfluence;
            y += bendOffset;
        }

        float m = uv.y - y;
        return 0.0175 / max(abs(m) + 0.01, 1e-3) + 0.01;
    }

    void mainImage(out vec4 fragColor, in vec2 fragCoord) {
        vec2 baseUv = (2.0 * fragCoord - iResolution.xy) / iResolution.y;
        baseUv.y *= -1.0;
        
        if (parallax) {
            baseUv += parallaxOffset;
        }

        vec3 col = vec3(0.0);
        vec3 b = background_color(baseUv);

        vec2 mouseUv = vec2(0.0);
        if (interactive) {
            mouseUv = (2.0 * iMouse - iResolution.xy) / iResolution.y;
            mouseUv.y *= -1.0;
        }
        
        // Bottom Wave
        for (int i = 0; i < LINE_COUNT; ++i) {
            float fi = float(i);
            float angle = bottomWavePosition.z * log(length(baseUv) + 1.0);
            vec2 ruv = baseUv * rotate(angle);
            col += b * wave(ruv + vec2(lineDistance * fi + bottomWavePosition.x, bottomWavePosition.y), 1.5 + 0.2 * fi, baseUv, mouseUv, interactive) * 0.2;
        }

        // Middle Wave
        for (int i = 0; i < LINE_COUNT; ++i) {
            float fi = float(i);
            float angle = middleWavePosition.z * log(length(baseUv) + 1.0);
            vec2 ruv = baseUv * rotate(angle);
            col += b * wave(ruv + vec2(lineDistance * fi + middleWavePosition.x, middleWavePosition.y), 2.0 + 0.15 * fi, baseUv, mouseUv, interactive);
        }

        // Top Wave
        for (int i = 0; i < LINE_COUNT; ++i) {
            float fi = float(i);
            float angle = topWavePosition.z * log(length(baseUv) + 1.0);
            vec2 ruv = baseUv * rotate(angle);
            ruv.x *= -1.0;
            col += b * wave(ruv + vec2(lineDistance * fi + topWavePosition.x, topWavePosition.y), 1.0 + 0.2 * fi, baseUv, mouseUv, interactive) * 0.1;
        }

        fragColor = vec4(col, 1.0);
    }

    void main() {
        vec4 color = vec4(0.0);
        mainImage(color, gl_FragCoord.xy);
        gl_FragColor = color;
    }
    `;

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    camera.position.z = 1;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    container.appendChild(renderer.domElement);

    const uniforms = {
        iTime: { value: 0 },
        iResolution: { value: new THREE.Vector3(1, 1, 1) },
        animationSpeed: { value: animationSpeed },
        lineDistance: { value: lineDistance },
        topWavePosition: { value: topWavePosition },
        middleWavePosition: { value: middleWavePosition },
        bottomWavePosition: { value: bottomWavePosition },
        iMouse: { value: new THREE.Vector2(-1000, -1000) },
        interactive: { value: interactive },
        bendRadius: { value: bendRadius },
        bendStrength: { value: bendStrength },
        bendInfluence: { value: 0 },
        parallax: { value: parallax },
        parallaxOffset: { value: new THREE.Vector2(0, 0) }
    };

    const material = new THREE.ShaderMaterial({
        uniforms,
        vertexShader,
        fragmentShader
    });

    const geometry = new THREE.PlaneGeometry(2, 2);
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const clock = new THREE.Clock();

    let targetMouse = new THREE.Vector2(-1000, -1000);
    let currentMouse = new THREE.Vector2(-1000, -1000);
    let targetInfluence = 0;
    let currentInfluence = 0;
    let targetParallax = new THREE.Vector2(0, 0);
    let currentParallax = new THREE.Vector2(0, 0);

    const setSize = () => {
        const width = container.clientWidth || 1;
        const height = container.clientHeight || 1;
        renderer.setSize(width, height, false);
        uniforms.iResolution.value.set(renderer.domElement.width, renderer.domElement.height, 1);
    };
    setSize();
    window.addEventListener('resize', setSize);

    const handlePointerMove = event => {
        const rect = renderer.domElement.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const dpr = renderer.getPixelRatio();

        targetMouse.set(x * dpr, (rect.height - y) * dpr);
        targetInfluence = 1.0;

        if (parallax) {
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const offsetX = (x - centerX) / rect.width;
            const offsetY = -(y - centerY) / rect.height;
            targetParallax.set(offsetX * parallaxStrength, offsetY * parallaxStrength);
        }
    };

    const handlePointerLeave = () => {
        targetInfluence = 0.0;
    };

    if (interactive) {
        renderer.domElement.addEventListener('pointermove', handlePointerMove);
        renderer.domElement.addEventListener('pointerleave', handlePointerLeave);
    }

    const renderLoop = () => {
        uniforms.iTime.value = clock.getElapsedTime();

        if (interactive) {
            currentMouse.lerp(targetMouse, mouseDamping);
            uniforms.iMouse.value.copy(currentMouse);

            currentInfluence += (targetInfluence - currentInfluence) * mouseDamping;
            uniforms.bendInfluence.value = currentInfluence;
        }

        if (parallax) {
            currentParallax.lerp(targetParallax, mouseDamping);
            uniforms.parallaxOffset.value.copy(currentParallax);
        }

        renderer.render(scene, camera);
        requestAnimationFrame(renderLoop);
    };
    renderLoop();
});