"""Blender: renderiza os modelos em imagens (impostores) e modela a fachada do campus.
Uso: blender -b -noaudio -P scripts/assets/render_sprites.py -- <pasta de saída>
Saída: <nome>_tilt.png e <nome>_top.png, wall.png e meta.json.
"""
import json, math, os, sys
import bpy
from mathutils import Vector

OUT = sys.argv[sys.argv.index('--') + 1]
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
MODELS = os.path.join(ROOT, 'referencias', 'modelos')
TREES = ['tree_oak', 'tree_default', 'tree_fat']
HOUSES = ['building-type-a', 'building-type-c', 'building-type-e', 'building-type-h', 'building-type-k']
meta = {}


def lin(h):
    """Hex sRGB para o espaço linear do Blender."""
    c = [int(h[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    return tuple(x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c)


# Verdes de caatinga e tronco, no lugar das cores originais do kit.
LEAVES = {'tree_oak': '#7c9a4e', 'tree_default': '#8aa657', 'tree_fat': '#6e8e48'}
TRUNK = '#8a6a50'


def recolor(name, objs):
    for o in objs:
        for m in o.data.materials:
            b = m.node_tree.nodes.get('Principled BSDF') if m.use_nodes else None
            if not b:
                continue
            r, g, bl, _ = b.inputs['Base Color'].default_value
            leaf = g > r
            b.inputs['Base Color'].default_value = (*lin(LEAVES[name] if leaf else TRUNK), 1)
            b.inputs['Roughness'].default_value = 0.85
            b.inputs['Metallic'].default_value = 0


def clear():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    for col in (bpy.data.meshes, bpy.data.materials, bpy.data.images, bpy.data.cameras, bpy.data.lights):
        for x in list(col):
            col.remove(x)


def setup(sun_rot, res, samples=48):
    s = bpy.context.scene
    s.render.engine = 'CYCLES'
    s.cycles.samples = samples
    s.cycles.device = 'CPU'
    s.cycles.use_denoising = False
    s.render.film_transparent = True
    s.render.resolution_x, s.render.resolution_y = res
    s.render.image_settings.file_format = 'PNG'
    s.render.image_settings.color_mode = 'RGBA'
    s.view_settings.view_transform = 'Standard'
    w = bpy.data.worlds.new('w')
    w.use_nodes = True
    bg = w.node_tree.nodes['Background']
    bg.inputs[0].default_value = (0.86, 0.91, 1, 1)
    bg.inputs[1].default_value = 0.85
    s.world = w
    sun = bpy.data.lights.new('s', 'SUN')
    sun.energy = 2.6
    sun.angle = math.radians(14)
    sun.color = (1, 0.96, 0.88)
    so = bpy.data.objects.new('s', sun)
    s.collection.objects.link(so)
    so.rotation_euler = sun_rot


def camera(target, scale, elev, dist):
    cam = bpy.data.cameras.new('c')
    cam.type = 'ORTHO'
    cam.ortho_scale = scale
    cam.clip_end = dist * 4
    co = bpy.data.objects.new('c', cam)
    bpy.context.scene.collection.objects.link(co)
    bpy.context.scene.camera = co
    co.location = target + Vector((0, -dist * math.cos(elev), dist * math.sin(elev)))
    co.rotation_euler = (target - co.location).to_track_quat('-Z', 'Y').to_euler()
    return co


def render_model(name, res=384):
    clear()
    bpy.ops.import_scene.gltf(filepath=os.path.join(MODELS, name + '.glb'))
    objs = [o for o in bpy.context.scene.objects if o.type == 'MESH']
    if name in LEAVES:
        recolor(name, objs)
    bpy.context.view_layer.update()
    lo = Vector((1e9, 1e9, 1e9))
    hi = -lo
    for o in objs:
        for c in o.bound_box:
            w = o.matrix_world @ Vector(c)
            lo = Vector(map(min, lo, w))
            hi = Vector(map(max, hi, w))
    size = hi - lo
    span = max(size) * 1.5
    base = Vector(((lo.x + hi.x) / 2, (lo.y + hi.y) / 2, lo.z))
    centre = (lo + hi) / 2
    setup((math.radians(52), 0, math.radians(-38)), (res, res))
    entry = dict(radius=max(size.x, size.y) / 2, height=size.z, mpp=span / res)
    for view, elev in (('tilt', math.radians(40)), ('top', math.radians(89.9))):
        co = camera(centre, span, elev, span * 3)
        bpy.context.view_layer.update()
        rel = co.matrix_world.inverted() @ base
        entry[view] = dict(ax=0.5 + rel.x / span, ay=0.5 - rel.y / span)
        bpy.context.scene.render.filepath = os.path.join(OUT, f'{name}_{view}.png')
        bpy.ops.render.render(write_still=True)
        bpy.data.objects.remove(co)
    meta[name] = entry


def mat(name, rgb, rough=0.8, metal=0.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*rgb, 1)
    b.inputs['Roughness'].default_value = rough
    b.inputs['Metallic'].default_value = metal
    return m


def box(x0, x1, y0, y1, z0, z1, material):
    """x: largura da parede, z: altura, y: profundidade (negativo sai da parede)."""
    bpy.ops.mesh.primitive_cube_add(size=1, location=((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2))
    o = bpy.context.object
    o.scale = (x1 - x0, y1 - y0, z1 - z0)
    o.data.materials.append(material)
    return o


def render_wall():
    """Um módulo de fachada: 3,2 m de largura por 4,5 m de altura, repetido nas paredes."""
    clear()
    W, H = 3.2, 4.5
    wall = mat('wall', (0.86, 0.85, 0.82))
    slab = mat('slab', (0.72, 0.72, 0.71))
    frame = mat('frame', (0.25, 0.27, 0.3), 0.5)
    glass = mat('glass', (0.2, 0.31, 0.4), 0.12)
    sill = mat('sill', (0.93, 0.93, 0.91))
    wx0, wx1, wz0, wz1 = 0.5, 2.7, 1.25, 3.45
    for x0, x1, z0, z1 in ((-1, wx0, -1, H + 1), (wx1, W + 1, -1, H + 1), (wx0, wx1, -1, wz0), (wx0, wx1, wz1, H + 1)):
        box(x0, x1, 0, 0.3, z0, z1, wall)
    box(-1, W + 1, -0.07, 0.1, H - 0.34, H + 0.0, slab)        # faixa da laje
    box(-1, W + 1, -0.07, 0.1, -0.34, 0.0, slab)
    box(wx0 - 0.06, wx1 + 0.06, -0.16, 0.05, wz0 - 0.1, wz0 - 0.02, sill)   # peitoril
    box(wx0, wx1, 0.2, 0.28, wz0, wz1, glass)
    for x in (wx0, (wx0 + wx1) / 2 - 0.025, wx1 - 0.05):
        box(x, x + 0.05, 0.14, 0.24, wz0, wz1, frame)
    for z in (wz0, wz0 + 0.9, wz1 - 0.05):
        box(wx0, wx1, 0.14, 0.24, z, z + 0.05, frame)
    setup((math.radians(55), 0, math.radians(-30)), (128, 180), 64)
    bpy.context.scene.render.film_transparent = False
    bpy.context.scene.world.node_tree.nodes['Background'].inputs[1].default_value = 0.42
    bpy.data.lights['s'].energy = 1.5
    cam = bpy.data.cameras.new('c')
    cam.type = 'ORTHO'
    cam.ortho_scale = H
    bpy.context.scene.render.resolution_x = 128
    bpy.context.scene.render.resolution_y = 180
    co = bpy.data.objects.new('c', cam)
    bpy.context.scene.collection.objects.link(co)
    bpy.context.scene.camera = co
    co.location = (W / 2, -6, H / 2)
    cam.ortho_scale = H
    co.rotation_euler = (math.radians(90), 0, 0)
    bpy.context.scene.render.filepath = os.path.join(OUT, 'wall.png')
    bpy.ops.render.render(write_still=True)


for n in TREES + HOUSES:
    render_model(n)
render_wall()
json.dump(meta, open(os.path.join(OUT, 'meta.json'), 'w'), indent=1)
