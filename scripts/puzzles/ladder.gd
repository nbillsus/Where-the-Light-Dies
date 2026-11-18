@tool
class_name Ladder
extends Area3D
## A climbable ladder. Drop scenes/puzzles/ladder.tscn into a level.
##
## Place the origin at the bottom of the ladder, beside (not inside) the
## platform it leads to. Set `height` to the platform's top and
## `exit_direction` to the side the platform is on. The trigger area reaches
## a little above the top so the Keeper can climb back down from the platform.
##
## Owner: Lucas (behaviour). Neel places them.

const LAYER_TRIGGERS := 1 << 7
const LAYER_KEEPER := 1 << 1

## Height of the ladder top above its origin, in metres.
@export_range(0.5, 30.0, 0.05) var height := 4.0:
	set(value):
		height = value
		_rebuild()
## Which side the Keeper steps off at the top: -1 left, 1 right.
@export_enum("Left:-1", "Right:1") var exit_direction := 1
@export var width := 0.8:
	set(value):
		width = value
		_rebuild()

var _shape: CollisionShape3D
var _mesh: MeshInstance3D


func _ready() -> void:
	collision_layer = LAYER_TRIGGERS
	collision_mask = LAYER_KEEPER
	monitorable = false
	_rebuild()
	if not Engine.is_editor_hint():
		body_entered.connect(_on_body_entered)
		body_exited.connect(_on_body_exited)


func top_y() -> float:
	return global_position.y + height


func half_width() -> float:
	return width * 0.5


func _on_body_entered(body: Node3D) -> void:
	if body.has_method("register_ladder"):
		body.register_ladder(self)


func _on_body_exited(body: Node3D) -> void:
	if body.has_method("unregister_ladder"):
		body.unregister_ladder(self)


func _rebuild() -> void:
	if not is_inside_tree():
		return
	if _shape == null:
		_shape = CollisionShape3D.new()
		_shape.name = "TriggerShape"
		add_child(_shape, false, Node.INTERNAL_MODE_FRONT)
	# The grab zone is wider than the ladder and reaches above the top, so the
	# Keeper can grab it without exact lining up, including from the platform.
	var reach_above := 1.0
	var reach_side := 0.5
	var box := BoxShape3D.new()
	box.size = Vector3(width + reach_side * 2.0, height + reach_above, 1.0)
	_shape.shape = box
	_shape.position = Vector3(0.0, (height + reach_above) * 0.5, 0.0)

	if _mesh == null:
		_mesh = MeshInstance3D.new()
		_mesh.name = "PlaceholderMesh"
		add_child(_mesh, false, Node.INTERNAL_MODE_FRONT)
	_mesh.mesh = _build_placeholder_mesh()


## Two rails and evenly spaced rungs, until the environment kit has a real ladder.
func _build_placeholder_mesh() -> ArrayMesh:
	var material := StandardMaterial3D.new()
	material.albedo_color = Color(0.36, 0.26, 0.17)
	material.roughness = 0.9
	var st := SurfaceTool.new()
	st.begin(Mesh.PRIMITIVE_TRIANGLES)
	st.set_material(material)
	var rail := Vector3(0.08, height, 0.08)
	for side in [-1.0, 1.0]:
		_add_box(st, Vector3(side * (width * 0.5 - 0.04), height * 0.5, -0.3), rail)
	var rung_count := int(height / 0.35)
	for i in rung_count:
		var y := 0.25 + i * 0.35
		if y < height:
			_add_box(st, Vector3(0.0, y, -0.3), Vector3(width - 0.08, 0.05, 0.06))
	st.generate_normals()
	return st.commit()


func _add_box(st: SurfaceTool, center: Vector3, size: Vector3) -> void:
	var box := BoxMesh.new()
	box.size = size
	var arrays := box.get_mesh_arrays()
	var verts: PackedVector3Array = arrays[Mesh.ARRAY_VERTEX]
	var indices: PackedInt32Array = arrays[Mesh.ARRAY_INDEX]
	for index in indices:
		st.add_vertex(verts[index] + center)
