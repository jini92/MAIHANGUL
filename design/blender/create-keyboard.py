"""Original MAIHANGUL keyboard hero, built and rendered through Blender MCP.

Blender 5.2.1 LTS. No external models or textures. OFL Noto is downloaded
for local glyph generation and is not bundled as a runtime font.
Run this entire source with execute_blender_code; a new scene preserves prior work.
Outputs are absolute for the approved local workspace. Render may take a minute.
"""
import bpy
import math
import json
from mathutils import Vector

BLEND_PATH = 'C:/TEST/MAIHANGUL/design/blender/keyboard-studio.blend'
IMAGE_PATH = 'C:/TEST/MAIHANGUL/public/assets/keyboard-studio.webp'
FONT_PATH = 'C:/TEST/MAIHANGUL/.local/design-integrations/fonts/NotoSansCJKkr-Medium.otf'
RENDER = True

previous_scene_name = bpy.context.scene.name
scene = bpy.data.scenes.new('MAIHANGUL Keyboard Studio')
bpy.context.window.scene = scene
scene['provenance'] = 'Original geometry and materials authored for MAIHANGUL through Blender MCP.'
scene['layout'] = 'ANSI compact 5-row QWERTY; Korean two-set unshifted legends.'
scene['preserved_previous_scene'] = previous_scene_name
scene['font_usage'] = 'Noto Sans CJK KR Medium (SIL OFL 1.1) for key legends; source font is not packed. See OFL-NotoSansCJK.txt.'


def linear_channel(value):
    return value / 12.92 if value < 0.04045 else ((value + 0.055) / 1.055) ** 2.4


def material(name, hex_color, roughness=0.38, metallic=0.0):
    rgb = tuple(int(hex_color[i:i + 2], 16) / 255 for i in (0, 2, 4))
    rgba = tuple(linear_channel(channel) for channel in rgb) + (1.0,)
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = rgba
    mat.use_nodes = True
    shader = mat.node_tree.nodes.get('Principled BSDF')
    shader.inputs['Base Color'].default_value = rgba
    shader.inputs['Roughness'].default_value = roughness
    shader.inputs['Metallic'].default_value = metallic
    return mat


ivory = material('MH warm ivory ceramic keys', 'FFF9E8', 0.31)
secondary = material('MH pale sand modifier keys', 'E4E4D5', 0.38)
teal = material('MH deep teal anodized case', '0A6B61', 0.30, 0.18)
edge = material('MH dark teal plate', '15524D', 0.43)
ink = material('MH key legend ink', '21433E', 0.46)
blue = material('MH focus blue R key', '3065DC', 0.31)
orange = material('MH soft orange enter accent', 'E8A46F', 0.39)
white = material('MH warm white target legend', 'FFFDF6', 0.35)
shadow_material = material('MH neutral shadow receiver', 'F7F6EE', 0.70)

# Slightly translucent frosted shells; printed legends and accent keys stay solid.
for frosted, transmission, alpha in ((ivory, 0.24, 0.94), (secondary, 0.20, 0.95),
                                     (teal, 0.38, 0.86), (edge, 0.28, 0.84)):
    shader = frosted.node_tree.nodes.get('Principled BSDF')
    shader.inputs['Transmission Weight'].default_value = transmission
    shader.inputs['Alpha'].default_value = alpha
    shader.inputs['IOR'].default_value = 1.42
scene['finish'] = 'Subtle frosted translucency on case/keycaps; opaque legends, blue R and orange Enter.'


def rounded_box(name, location, dimensions, mat, bevel=0.09):
    bpy.ops.mesh.primitive_cube_add(size=1, location=location)
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = dimensions
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(mat)
    modifier = obj.modifiers.new('Soft machined edges', 'BEVEL')
    modifier.width = bevel
    modifier.segments = 5
    modifier.profile = 0.5
    normals = obj.modifiers.new('Weighted corner normals', 'WEIGHTED_NORMAL')
    normals.keep_sharp = True
    for polygon in obj.data.polygons:
        polygon.use_smooth = True
    return obj


rounded_box('Case / teal enclosure', (0, 0, 0.25), (15.7, 5.75, 0.65), teal, 0.24)
rounded_box('Case / dark inset plate', (0, 0, 0.589), (15.18, 5.13, 0.09), edge, 0.16)
rounded_box('Case / front lower seam', (0, -2.802, 0.12), (14.8, 0.017, 0.034), edge, 0.008)

font = bpy.data.fonts.load(FONT_PATH, check_existing=True)
font.use_fake_user = False

# Normalize this font once using H. Normalizing each glyph's height would stretch
# flat glyphs such as ㅡ or - into oversized shapes.
reference_curve = bpy.data.curves.new('MH font metric reference', 'FONT')
reference_curve.font = font
reference_curve.body = 'H'
reference_curve.size = 1.0
reference_object = bpy.data.objects.new('MH font metric reference', reference_curve)
scene.collection.objects.link(reference_object)
bpy.context.view_layer.update()
font_scale = 0.72 / reference_object.dimensions.y
bpy.data.objects.remove(reference_object, do_unlink=True)
bpy.data.curves.remove(reference_curve)


def legend(name, body, x, y, z, size, mat, align='CENTER'):
    curve = bpy.data.curves.new(name, 'FONT')
    curve.body = body
    curve.font = font
    curve.size = size
    curve.align_x = align
    curve.align_y = 'CENTER'
    curve.resolution_u = 10
    curve.extrude = 0.0005
    obj = bpy.data.objects.new(name, curve)
    scene.collection.objects.link(obj)
    obj.location = (x, y, z)
    curve.materials.append(mat)
    obj.scale = (font_scale, font_scale, font_scale)
    # Convert only this new legend, so the saved model has no font dependency.
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    curve_name = curve.name
    bpy.ops.object.convert(target='MESH')
    unused_curve = bpy.data.curves.get(curve_name)
    if unused_curve is not None and unused_curve.users == 0:
        bpy.data.curves.remove(unused_curve)
    return obj


korean = dict(zip('QWERTYUIOPASDFGHJKLZXCVBNM',
                  ('ㅂ', 'ㅈ', 'ㄷ', 'ㄱ', 'ㅅ', 'ㅛ', 'ㅕ', 'ㅑ', 'ㅐ', 'ㅔ',
                   'ㅁ', 'ㄴ', 'ㅇ', 'ㄹ', 'ㅎ', 'ㅗ', 'ㅓ', 'ㅏ', 'ㅣ',
                   'ㅋ', 'ㅌ', 'ㅊ', 'ㅍ', 'ㅠ', 'ㅜ', 'ㅡ')))

# All rows sum to 15 physical key units. Modifiers preserve real ANSI offsets.
rows = [
    [('`', 1), ('1', 1), ('2', 1), ('3', 1), ('4', 1), ('5', 1),
     ('6', 1), ('7', 1), ('8', 1), ('9', 1), ('0', 1), ('-', 1), ('=', 1), ('Backspace', 2)],
    [('Tab', 1.5), ('Q', 1), ('W', 1), ('E', 1), ('R', 1), ('T', 1),
     ('Y', 1), ('U', 1), ('I', 1), ('O', 1), ('P', 1), ('[', 1), (']', 1), ('\\', 1.5)],
    [('Caps Lock', 1.75), ('A', 1), ('S', 1), ('D', 1), ('F', 1), ('G', 1),
     ('H', 1), ('J', 1), ('K', 1), ('L', 1), (';', 1), ("'", 1), ('Enter', 2.25)],
    [('Shift', 2.25), ('Z', 1), ('X', 1), ('C', 1), ('V', 1), ('B', 1),
     ('N', 1), ('M', 1), (',', 1), ('.', 1), ('/', 1), ('Shift', 2.75)],
    [('Ctrl', 1.25), ('Win', 1.25), ('Alt', 1.25), ('Space', 6.25),
     ('Alt', 1.25), ('Win', 1.25), ('Menu', 1.25), ('Ctrl', 1.25)],
]
assert all(abs(sum(width for text, width in row) - 15) < 0.001 for row in rows)

key_count = 0
for row_index, row in enumerate(rows):
    offset = -7.5
    y = 2 - row_index
    for index, (label, width) in enumerate(row):
        x = offset + width / 2
        offset += width
        is_target = label == 'R'
        z_lift = 0.12 if is_target else 0.0
        key_mat = blue if is_target else orange if label == 'Enter' else secondary if width > 1 else ivory
        key = rounded_box('Key %s / %02d-%02d' % (label, row_index, index),
                          (x, y, 0.82 + z_lift), (width - 0.12, 0.87, 0.43), key_mat, 0.085)
        key['physical_key'] = label
        key['korean_unshifted'] = korean.get(label, '')
        key_count += 1
        legend_z = 1.039 + z_lift
        legend_mat = white if is_target else ink
        if label in korean:
            legend('Latin / ' + label, label, x - 0.29, y + 0.24, legend_z, 0.17, legend_mat, 'LEFT')
            legend('Korean / ' + label, korean[label], x + 0.09, y - 0.06, legend_z, 0.43, legend_mat)
        elif label == 'Space':
            # Tiny centered mark keeps this a physical keycap, without false text.
            rounded_box('Space / subtle center bar', (x, y, legend_z), (0.55, 0.026, 0.006), ink, 0.01)
        else:
            label_size = 0.175 if len(label) > 1 else 0.29
            legend('Legend / %02d-%02d' % (row_index, index), label, x, y, legend_z, label_size, legend_mat)
        if label in ('F', 'J'):
            rounded_box('Homing ridge / ' + label, (x, y - 0.31, legend_z + 0.014), (0.23, 0.044, 0.023), ink, 0.011)

# The OFL source font remains a local download; do not pack it into the model.
if not bpy.data.user_map(subset={font}).get(font, set()):
    bpy.data.fonts.remove(font, do_unlink=True)

bpy.ops.mesh.primitive_plane_add(size=200, location=(0, 0, -0.079))
shadow = bpy.context.object
shadow.name = 'Lighting / transparent contact shadow catcher'
shadow.data.materials.append(shadow_material)
shadow.is_shadow_catcher = True

world = bpy.data.worlds.new('MH neutral studio world')
scene.world = world
world.use_nodes = True
world.node_tree.nodes.get('Background').inputs['Color'].default_value = (0.76, 0.81, 0.86, 1)
world.node_tree.nodes.get('Background').inputs['Strength'].default_value = 0.45


def area_light(name, location, energy, size, color):
    data = bpy.data.lights.new(name, 'AREA')
    data.energy = energy
    data.shape = 'DISK'
    data.size = size
    data.color = color
    obj = bpy.data.objects.new(name, data)
    scene.collection.objects.link(obj)
    obj.location = location
    obj.rotation_euler = (Vector((0, 0, 0.3)) - obj.location).to_track_quat('-Z', 'Y').to_euler()
    return obj


area_light('Lighting / large soft key', (-5, -4, 12), 1700, 8, (1.0, 0.92, 0.80))
area_light('Lighting / cool rim', (7, 5, 9), 1300, 7, (0.81, 0.90, 1.0))
area_light('Lighting / front fill', (1, -9, 6), 550, 6, (1.0, 0.97, 0.90))

camera_data = bpy.data.cameras.new('Camera / keyboard hero')
camera = bpy.data.objects.new('Camera / keyboard hero', camera_data)
scene.collection.objects.link(camera)
scene.camera = camera
camera.location = (8, -11, 17)
camera.rotation_euler = (Vector((0, 0, 0.35)) - camera.location).to_track_quat('-Z', 'Y').to_euler()
camera_data.type = 'ORTHO'
camera_data.ortho_scale = 18.4
camera_data.lens = 50

scene.render.engine = 'CYCLES'
scene.cycles.device = 'CPU'
scene.cycles.samples = 48
scene.cycles.use_denoising = True
scene.cycles.max_bounces = 5
scene.cycles.diffuse_bounces = 3
scene.cycles.glossy_bounces = 3
scene.render.resolution_x = 1400
scene.render.resolution_y = 900
scene.render.resolution_percentage = 100
scene.render.film_transparent = True
scene.render.image_settings.file_format = 'WEBP'
scene.render.image_settings.color_mode = 'RGBA'
scene.render.image_settings.quality = 90
scene.render.filepath = IMAGE_PATH
scene.view_settings.view_transform = 'AgX'
scene.view_settings.look = 'AgX - Medium High Contrast'
scene.view_settings.exposure = 0.45
scene.render.use_file_extension = True
scene['key_count'] = key_count
scene['asset_role'] = 'Decorative home hero; the interactive training keyboard remains HTML.'

bpy.ops.object.select_all(action='DESELECT')
bpy.context.view_layer.objects.active = None
bpy.ops.wm.save_as_mainfile(filepath=BLEND_PATH)
print(json.dumps({'stage': 'model_saved', 'scene': scene.name, 'key_count': key_count,
                  'objects': len(scene.objects), 'previous_scene': previous_scene_name,
                  'blend': BLEND_PATH, 'image': IMAGE_PATH, 'version': bpy.app.version_string}))
if RENDER:
    bpy.ops.render.render(write_still=True)
    print(json.dumps({'stage': 'render_complete', 'path': IMAGE_PATH, 'width': 1400, 'height': 900}))
