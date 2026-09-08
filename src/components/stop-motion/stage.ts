import * as THREE from 'three';
import { createFarm } from './farm';
import { Actor, Project, Scene } from './model';

const radians = THREE.MathUtils.degToRad;
export class Stage {
  readonly canvas: HTMLCanvasElement;
  private renderer: THREE.WebGLRenderer;
  private world = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(35, 16 / 9, .1, 100);
  private actors = new THREE.Group();
  private farm = createFarm();
  private sphere = new THREE.SphereGeometry(1, 20, 14);
  private cylinder = new THREE.CylinderGeometry(1, 1, 1, 24);
  private ear = new THREE.ConeGeometry(1, 1, 3);
  private ring = new THREE.TorusGeometry(1, .12, 10, 28);
  private materials = new Map<string, THREE.MeshStandardMaterial>();
  private backdrop: HTMLImageElement | null = null;
  private backdropSource = '';
  private disposed = false;

  constructor(canvas = document.createElement('canvas')) {
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    this.renderer.setPixelRatio(1);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.world.add(new THREE.HemisphereLight('#ffffff', '#8a8278', 2.6));
    const light = new THREE.DirectionalLight('#fff5e5', 3.2);
    light.position.set(-3, 7, 6); light.castShadow = true;
    light.shadow.mapSize.set(1024, 1024);
    Object.assign(light.shadow.camera, { left: -7, right: 7, top: 7, bottom: -7 });
    light.shadow.bias = -.001;
    this.world.add(light, this.actors, this.farm);
    this.farm.visible = false;
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.ShadowMaterial({ opacity: .16 }));
    floor.rotation.x = -Math.PI / 2; floor.position.y = -.015; floor.receiveShadow = true;
    this.world.add(floor);
  }
  async setBackdrop(source: string): Promise<void> {
    if (source === this.backdropSource) return;
    this.backdropSource = source; this.backdrop = null;
    if (!source) return;
    const image = new Image();
    await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = () => reject(new Error('Não foi possível carregar a imagem de cenário.')); image.src = source; });
    if (!this.disposed && source === this.backdropSource) this.backdrop = image;
  }
  private material(color: string, ghost: boolean): THREE.MeshStandardMaterial {
    const key = ghost ? 'ghost' : color;
    if (!this.materials.has(key)) this.materials.set(key, new THREE.MeshStandardMaterial({ color: ghost ? '#16a8a2' : color, roughness: .83, transparent: ghost, opacity: ghost ? .2 : 1, depthWrite: !ghost }));
    return this.materials.get(key)!;
  }
  private actor(actor: Actor, ghost: boolean): THREE.Group {
    const root = new THREE.Group(); root.position.set(actor.x, actor.y, actor.z); root.rotation.y = radians(actor.rotation); root.scale.setScalar(actor.scale);
    const shape = (parent: THREE.Group, geo: THREE.BufferGeometry, color: string, position: number[], scale: number[]) => {
      const mesh = new THREE.Mesh(geo, this.material(color, ghost));
      mesh.position.set(position[0], position[1], position[2]); mesh.scale.set(scale[0], scale[1], scale[2]);
      mesh.castShadow = !ghost; mesh.receiveShadow = !ghost; mesh.userData.actorId = ghost ? null : actor.id; parent.add(mesh); return mesh;
    };
    const ball = (parent: THREE.Group, color: string, pos: number[], scale: number[]) => shape(parent, this.sphere, color, pos, scale);
    const skin = actor.kind === 'person' ? '#bb8061' : actor.color;
    const bodyY = actor.kind === 'cup' ? 1.1 : 1.23;
    if (actor.kind === 'cup') {
      shape(root, this.cylinder, actor.color, [0, 1.22, 0], [.5, .95, .4]);
      shape(root, this.cylinder, '#513224', [0, 1.704, 0], [.44, .015, .34]);
      shape(root, this.ring, actor.color, [.61, 1.28, 0], [.3, .34, .3]);
    } else ball(root, actor.color, [0, bodyY, 0], [.42, .58, .31]);
    const head = new THREE.Group(); head.position.set(0, actor.kind === 'cup' ? 1.34 : 2.05, .01); head.rotation.z = radians(actor.pose.head); root.add(head);
    if (actor.kind !== 'cup') ball(head, skin, [0, 0, 0], [.48, .45, .4]);
    if (actor.kind === 'rabbit') {
      for (const side of [-1, 1]) { const ear = ball(head, skin, [side * .24, .63, -.05], [.145, .5, .135]); ear.rotation.z = side * -.16; ball(head, '#e4a6ab', [side * .24, .64, .065], [.075, .34, .04]); }
      ball(root, '#fff8e7', [0, 1.13, .27], [.28, .34, .09]); ball(root, skin, [0, .94, -.35], [.22, .22, .22]);
    }
    if (actor.kind === 'cat') {
      for (const side of [-1, 1]) shape(head, this.ear, skin, [side * .31, .4, -.04], [.23, .4, .25]);
      const tail = shape(root, this.ring, skin, [.39, 1, -.29], [.4, .47, .4]); tail.rotation.y = .5;
      ball(head, '#f9e2c7', [0, -.16, .33], [.28, .17, .12]);
    }
    if (actor.kind === 'person') {
      ball(head, '#382d2c', [0, .26, -.09], [.5, .25, .4]);
      for (const side of [-1, 1]) ball(head, skin, [side * .46, 0, 0], [.09, .13, .12]);
    }
    if (actor.kind === 'goat') {
      for (const side of [-1, 1]) {
        const horn = shape(head, this.ear, '#947352', [side * .26, .53, -.08], [.13, .45, .14]); horn.rotation.z = side * -.22;
        const ear = ball(head, skin, [side * .52, .12, -.01], [.29, .12, .13]); ear.rotation.z = side * .25;
        ball(head, '#c9a783', [side * .55, .14, .1], [.17, .05, .03]);
      }
      ball(head, '#eadabb', [0, -.16, .35], [.28, .21, .14]);
      ball(head, '#70533e', [0, -.13, .48], [.12, .065, .04]);
      const beard = shape(head, this.ear, '#d5c3a1', [0, -.49, .16], [.17, .28, .13]); beard.rotation.z = Math.PI;
      shape(root, this.ring, '#36563f', [0, 1.64, 0], [.39, .12, .34]).rotation.x = Math.PI / 2;
      const scarf = ball(root, '#36563f', [.16, 1.43, .33], [.12, .28, .055]); scarf.rotation.z = -.4;
    }
    if (actor.kind === 'hen') {
      for (const offset of [-.19, 0, .19]) ball(head, '#b74734', [offset, .45 + (offset === 0 ? .09 : 0), 0], [.115, .18, .12]);
      const beak = shape(head, this.ear, '#de792e', [0, -.12, .47], [.16, .2 + actor.pose.mouth * .13, .15]); beak.rotation.x = Math.PI / 2;
      ball(head, '#b74734', [0, -.34, .3], [.095, .13, .07]);
      for (const side of [-1, 0, 1]) {
        const feather = ball(root, '#c68b32', [side * .14, 1.45, -.36], [.14, .35, .1]); feather.rotation.x = -.6;
      }
    }
    for (const side of [-1, 1]) {
      ball(head, '#ffffff', [side * .17, .05, actor.kind === 'cup' ? .39 : .36], [.095, .112, .045]);
      ball(head, '#172d36', [side * .17, .05, actor.kind === 'cup' ? .43 : .4], [.043, .061, .023]);
    }
    if (actor.kind !== 'hen') ball(head, '#633f38', [0, -.24, actor.kind === 'cup' ? .405 : actor.kind === 'goat' ? .48 : .39], [.09, .018 + actor.pose.mouth * .08, .026]);
    for (const side of [-1, 1]) {
      const arm = new THREE.Group(); arm.position.set(side * .43, 1.55, 0); arm.rotation.z = radians(side < 0 ? -actor.pose.leftArm : -actor.pose.rightArm); root.add(arm);
      ball(arm, actor.kind === 'person' ? actor.color : skin, [0, -.26, 0], actor.kind === 'hen' ? [.2, .36, .1] : [.12, .34, .12]);
      if (actor.kind !== 'hen') ball(arm, skin, [0, -.58, .015], [.14, .15, .14]);
      const leg = new THREE.Group(); leg.position.set(side * .22, .77, 0); leg.rotation.x = radians(side < 0 ? actor.pose.leftLeg : actor.pose.rightLeg); root.add(leg);
      ball(leg, actor.kind === 'person' ? '#29434e' : skin, [0, -.28, 0], [.145, .32, .15]);
      ball(leg, actor.kind === 'person' ? '#26333c' : actor.kind === 'goat' ? '#70533e' : actor.kind === 'hen' ? '#de792e' : skin, [0, -.66, .12], [.19, .11, .26]);
    }
    return root;
  }
  render(scene: Scene, settings: Pick<Project, 'ratio' | 'background' | 'environment'>, previous?: Scene, selected?: string, width = 960): HTMLCanvasElement {
    const aspect = settings.ratio === '16:9' ? 16 / 9 : settings.ratio === '9:16' ? 9 / 16 : 1;
    const height = Math.round(width / aspect);
    if (this.canvas.width !== width || this.canvas.height !== height) { this.canvas.width = width; this.canvas.height = height; }
    // React StrictMode can recreate the renderer while reusing the output canvas.
    // Check both surfaces: otherwise a fresh 300x150 renderer appears in a corner.
    if (this.renderer.domElement.width !== width || this.renderer.domElement.height !== height) this.renderer.setSize(width, height, false);
    this.camera.aspect = aspect;
    const distance = (aspect < 1 ? 12 : 8.8) / scene.camera.zoom, angle = radians(scene.camera.angle), elevation = radians(scene.camera.elevation);
    this.camera.position.set(Math.sin(angle) * distance, 1.4 + Math.sin(elevation) * distance, Math.cos(angle) * Math.cos(elevation) * distance);
    this.camera.lookAt(0, 1.3, 0); this.camera.updateProjectionMatrix(); this.camera.updateMatrixWorld();
    this.farm.visible = settings.environment === 'farm';
    this.actors.clear();
    if (previous) previous.actors.forEach(actor => this.actors.add(this.actor(actor, true)));
    scene.actors.forEach(actor => {
      this.actors.add(this.actor(actor, false));
      if (actor.id === selected) { const selection = new THREE.Mesh(this.ring, this.material('#d39b4c', false)); selection.rotation.x = -Math.PI / 2; selection.scale.setScalar(.68 * actor.scale); selection.position.set(actor.x, .012, actor.z); this.actors.add(selection); }
    });
    this.renderer.render(this.world, this.camera);
    const context = this.canvas.getContext('2d')!;
    context.fillStyle = settings.background; context.fillRect(0, 0, width, height);
    if (this.backdrop) { const factor = Math.max(width / this.backdrop.width, height / this.backdrop.height); const w = this.backdrop.width * factor, h = this.backdrop.height * factor; context.drawImage(this.backdrop, (width - w) / 2, (height - h) / 2, w, h); }
    else { const gradient = context.createLinearGradient(0, 0, 0, height); gradient.addColorStop(0, '#ffffff55'); gradient.addColorStop(.65, '#ffffff00'); gradient.addColorStop(1, '#46647726'); context.fillStyle = gradient; context.fillRect(0, 0, width, height); }
    context.drawImage(this.renderer.domElement, 0, 0); return this.canvas;
  }
  pick(x: number, y: number): string | undefined {
    const ray = new THREE.Raycaster(); ray.setFromCamera(new THREE.Vector2(x, y), this.camera);
    return ray.intersectObjects(this.actors.children, true).find(hit => hit.object.userData.actorId)?.object.userData.actorId;
  }
  pickAtPointer(clientX: number, clientY: number): string | undefined {
    const box = this.canvas.getBoundingClientRect();
    const scale = Math.min(box.width / this.canvas.width, box.height / this.canvas.height);
    const width = this.canvas.width * scale, height = this.canvas.height * scale;
    const x = clientX - box.left - (box.width - width) / 2, y = clientY - box.top - (box.height - height) / 2;
    if (x < 0 || y < 0 || x > width || y > height) return undefined;
    return this.pick(x / width * 2 - 1, -y / height * 2 + 1);
  }
  dispose(): void {
    this.disposed = true;
    this.world.traverse(object => { if (object instanceof THREE.Mesh) { object.geometry.dispose(); if (object.material instanceof THREE.Material) object.material.dispose(); } });
    [this.sphere, this.cylinder, this.ear, this.ring].forEach(g => g.dispose());
    this.materials.forEach(m => m.dispose()); this.materials.clear(); this.renderer.dispose(); this.renderer.forceContextLoss();
  }
}
