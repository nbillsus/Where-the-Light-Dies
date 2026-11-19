class_name FollowCamera
extends Camera3D
## Side-on 2.5D camera that smoothly follows a target and looks ahead.
##
## Set `target` to the character being controlled. In Step 3 this switches
## between the Keeper and the Shadow.
##
## Owner: Lucas.

@export var target: Node3D:
	set(value):
		target = value
		if is_inside_tree() and target != null and snap_on_target_change:
			snap_to_target()
## Camera position relative to the target's feet.
@export var offset := Vector3(0.0, 2.2, 13.0)
## How far ahead of the target to look, in the direction it faces.
@export var look_ahead := 1.5
## Higher = tighter follow. Horizontal and vertical are separate so jumps
## don't jerk the camera.
@export var horizontal_smoothing := 5.0
@export var vertical_smoothing := 3.0
## Jump straight to a new target instead of gliding to it.
@export var snap_on_target_change := false

var _look_ahead_current := 0.0


func _ready() -> void:
	snap_to_target()


func snap_to_target() -> void:
	if target == null:
		return
	_look_ahead_current = _target_facing() * look_ahead
	global_position = target.global_position + offset + Vector3(_look_ahead_current, 0.0, 0.0)


func _physics_process(delta: float) -> void:
	if target == null:
		return
	_look_ahead_current = lerpf(_look_ahead_current, _target_facing() * look_ahead,
		1.0 - exp(-2.0 * delta))
	var desired := target.global_position + offset + Vector3(_look_ahead_current, 0.0, 0.0)
	global_position.x = lerpf(global_position.x, desired.x, 1.0 - exp(-horizontal_smoothing * delta))
	global_position.y = lerpf(global_position.y, desired.y, 1.0 - exp(-vertical_smoothing * delta))
	global_position.z = desired.z


func _target_facing() -> float:
	var facing = target.get("facing")
	return facing if facing is float else 1.0
