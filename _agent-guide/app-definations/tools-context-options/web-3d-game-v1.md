- **Tech Stack**: 
    Three.js r160+ (For 3D Graphics and Rendering)
    React Three Fiber v8+ (For React Integration with Three.js)
    @react-three/rapier (For Physics Engine - Rapier Integration)
    @react-three/drei (For Three.js Helpers and Abstractions)
    @react-three/postprocessing (For Post-Processing Effects)
    TypeScript 5+
    Vite 5+ (For Fast Build Tool)
    React 18+ (For UI Framework with Concurrent Features)
    Zustand (For Lightweight State Management)
    Tailwind CSS (For UI Components)
    Leva (For Debug GUI and Controls)
    @react-three/xr (For WebXR/VR Support - Optional)
    Tone.js or Howler.js (For Audio Management with Spatial Audio)
    GLTFJSX (For Converting GLTF to JSX Components)

- **Environment Validation**:
    - Verify Node.js version: `node --version` (recommend v18+ or v20+)
    - Use nvm if needed: `source ~/.nvm/nvm.sh && nvm use`

- **Version Management**:
    - Version file: `package.json`
    - Read current version: `node -p "require('./package.json').version"`
    - Update version field in package.json using `edit` tool
    - Commit command: `git add package.json && git commit -m "chore(version): bump version to X.Y.Z" && git push`

- **Build Command**:
    - Production build: `npm run build` or `vite build`
    - Development: `npm run dev` or `vite`
    - Preview production build: `npm run preview` or `vite preview`
    - Verify build succeeds before committing changes

- **Code Quality Standards**:
    - Use TypeScript strict mode (`noImplicitAny`, `strictNullChecks`)
    - Use camelCase for variables/functions and PascalCase for classes/interfaces/components
    - No console.log statements in production code (use Leva for debugging instead)
    - All TypeScript errors must be resolved before commit
    - No unused imports or variables
    - Optimize for 60fps performance

- **3D Game Architecture**:
    - Use React Three Fiber for declarative 3D scene management with React 18 Suspense
    - Implement physics with @react-three/rapier for realistic interactions and collisions
    - Use RigidBody, CuboidCollider, BallCollider from @react-three/rapier for collision detection
    - Structure game logic with ECS (Entity Component System) pattern when possible
    - Use Drei helpers for cameras, controls, and environment setup
    - Implement game loop using useFrame hook from React Three Fiber
    - Separate game state from rendering logic with Zustand stores
    - Use Web Workers for heavy computations to maintain 60fps
    - Leverage React 18 concurrent features for better performance

- **Performance Best Practices**:
    - Implement LOD (Level of Detail) for complex models using drei's <Detailed>
    - Use instancing for repeated objects with <Instances> from drei
    - Optimize textures and use texture atlases, consider KTX2/Basis compression
    - Implement frustum culling (automatic in Three.js) and occlusion culling
    - Use object pooling for frequently created/destroyed objects
    - Lazy load assets with React.lazy and Suspense
    - Monitor performance with <Perf> from @react-three/drei
    - Use <BakeShadows> for static shadows to improve performance
    - Implement progressive loading for large scenes

- **Asset Management**:
    - Use GLTF/GLB format for 3D models (industry standard)
    - Convert GLTF to React components using gltfjsx CLI tool
    - Compress textures using KTX2/Basis Universal for smaller file sizes
    - Use Draco compression for geometry in GLTF files
    - Implement asset preloading with useGLTF.preload() from drei
    - Use useLoader, useGLTF hooks with Suspense for async asset loading
    - Store assets in /public/models, /public/textures directories
    - Consider using Sketchfab, Poly Haven, or Kenney for free assets

- **Game Features**:
    - Implement player controls using KeyboardControls from drei (keyboard, mouse, gamepad)
    - Add collision detection with RigidBody and Colliders from @react-three/rapier
    - Handle collision events with onCollisionEnter, onCollisionExit callbacks
    - Create particle systems using drei's <Sparkles> or custom instanced meshes
    - Implement camera systems: <FirstPersonControls>, <PointerLockControls>, <OrbitControls> from drei
    - Add post-processing with EffectComposer from @react-three/postprocessing (bloom, SSAO, etc.)
    - Implement UI overlay with HTML from drei or standard React components
    - Add positional audio with <PositionalAudio> from drei for spatial sound
    - Use Leva for runtime debugging and parameter tweaking

- **Testing**:
    - Use Vitest for unit testing game logic and utilities
    - Use @testing-library/react for component testing
    - Test physics interactions in isolation with mock Rapier contexts
    - Implement visual regression testing with Playwright or Percy
    - Performance testing for frame rate consistency (target 60fps)
    - Cross-browser compatibility testing (Chrome, Firefox, Safari, Edge)
    - Test WebGL support and fallbacks

- **Deployment**:
    - Build with Vite for optimized production bundle (code splitting, tree shaking)
    - Deploy to Vercel (recommended for React apps), Netlify, or Cloudflare Pages
    - Implement CDN for asset delivery (Cloudflare, AWS CloudFront)
    - Enable gzip/brotli compression for assets
    - Consider WebGL 2.0 with WebGL 1.0 fallback
    - Add loading screen and progressive enhancement
    - Monitor performance with Web Vitals and analytics
    - Set appropriate cache headers for static assets
