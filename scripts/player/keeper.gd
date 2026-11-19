class_name Keeper
extends CharacterBody3D
## The Keeper: 2.5D platforming controller.
##
## Moves on the X/Y gameplay plane only (Z is held at 0). The node's origin is
## at the Keeper's feet. States: NORMAL (run/jump/fall), MANTLE (pulling up
## onto a ledge), LADDER (climbing) and PUSH (holding a block).
##
## Owner: Lucas. Tuning lives in a KeeperTuning resource, not in this file.

enum State { NORMAL, MANTLE, LADDER, PUSH }

signal state_changed(new_state: State)

## Physics layers (see docs/TECHNICAL_DESIGN.md).
const LAYER_WORLD := 1 << 0
const LAYER_PUSHABLE := 1 << 4
const LAYER_GRATES := 1 << 5
const LAYER_SOLID_SHADOW := 1 << 6
## What counts as a ledge you can mantle onto.
const MANTLE_MASK := LAYER_WORLD | LAYER_PUSHABLE | LAYER_SOLID_SHADOW
## What must be clear for the Keeper to fit somewhere.
const BODY_MASK := LAYER_WORLD | LAYER_PUSHABLE | LAYER_GRATES | LAYER_SOLID_SHADOW
## Re-grabbing a ladder right after jumping off it is blocked for this long.
const LADDER_REGRAB_DELAY := 0.25

@export var tuning: KeeperTuning
## When false the Keeper ignores player input and holds its stance.
## The Shadow controller turns this off while the player drives the Shadow.
@export var input_enabled := true:
	set(value):
		input_enabled = value
		if not value:
			_release_block()

var state: State = State.NORMAL
## 1.0 = facing right, -1.0 = facing left.
var facing := 1.0

var _coyote_timer := 0.0
var _jump_buffer_timer := 0.0
var _can_cut_jump := false
var _was_on_floor := true

var _mantle_from := Vector3.ZERO
var _mantle_to := Vector3.ZERO
var _mantle_time := 0.0

var _nearby_ladders: Array[Ladder] = []
var _ladder: Ladder
var _ladder_regrab_timer := 0.0

var _block: PushableBlock

@onready var _collision: CollisionShape3D = $CollisionShape3D
@onready var _visual: Node3D = $Visual
@onready var _radius: float = (_collision.shape as CapsuleShape3D).radius


func _ready() -> void:
	if tuning == null:
		tuning = KeeperTuning.new()


func _physics_process(delta: float) -> void:
	var move := _read_move_input()
	_ladder_regrab_timer = maxf(_ladder_regrab_timer - delta, 0.0)

	match state:
		State.NORMAL:
			_process_normal(delta, move)
		State.MANTLE:
			_process_mantle(delta)
		State.LADDER:
			_process_ladder(delta, move)
		State.PUSH:
			_process_push(delta, move)

	# Stay on the gameplay plane.
	global_position.z = 0.0
	velocity.z = 0.0
	_update_visual(delta)


# --- Public API ---------------------------------------------------------------

## Called by Ladder areas as the Keeper enters and leaves them.
func register_ladder(ladder: Ladder) -> void:
	if not _nearby_ladders.has(ladder):
		_nearby_ladders.append(ladder)


func unregister_ladder(ladder: Ladder) -> void:
	_nearby_ladders.erase(ladder)
	if ladder == _ladder:
		_set_state(State.NORMAL)


## Moves the Keeper instantly (respawn, checkpoints, tests). Clears motion.
func teleport(feet_position: Vector3) -> void:
	_release_block()
	_ladder = null
	velocity = Vector3.ZERO
	global_position = Vector3(feet_position.x, feet_position.y, 0.0)
	_set_state(State.NORMAL)


# --- States -------------------------------------------------------------------

func _process_normal(delta: float, move: Vector2) -> void:
	var on_floor := is_on_floor()
	_coyote_timer = tuning.coyote_time if on_floor else _coyote_timer - delta
	_jump_buffer_timer -= delta
	if _jump_just_pressed():
		_jump_buffer_timer = tuning.jump_buffer_time

	# Horizontal.
	var target_speed := move.x * tuning.run_speed
	var has_input := absf(move.x) > 0.1
	var accel: float
	if on_floor:
		accel = tuning.ground_accel if has_input else tuning.ground_decel
	else:
		accel = tuning.air_accel if has_input else tuning.air_decel
	velocity.x = move_toward(velocity.x, target_speed, accel * delta)
	if has_input:
		facing = signf(move.x)

	# Vertical.
	if _jump_buffer_timer > 0.0 and _coyote_timer > 0.0:
		velocity.y = tuning.jump_velocity()
		_jump_buffer_timer = 0.0
		_coyote_timer = 0.0
		_can_cut_jump = true
	else:
		var gravity := tuning.gravity()
		if velocity.y < 0.0:
			gravity *= tuning.fall_gravity_multiplier
		velocity.y = maxf(velocity.y - gravity * delta, -tuning.max_fall_speed)

	# Variable jump height: releasing early cuts the rise once.
	if _can_cut_jump and velocity.y > 0.0 and not _jump_held():
		velocity.y *= tuning.jump_cut
		_can_cut_jump = false
	if velocity.y <= 0.0:
		_can_cut_jump = false

	# Grab a ladder.
	if _try_grab_ladder(move, on_floor):
		return

	# Grab a block.
	if on_floor and _interact_held():
		var block := _find_block_in_front()
		if block != null:
			_block = block
			velocity.x = 0.0
			_set_state(State.PUSH)
			return

	var fall_speed := -velocity.y
	move_and_slide()

	if is_on_floor() and not _was_on_floor:
		GameEvents.keeper_landed.emit(maxf(fall_speed, 0.0))
	_was_on_floor = is_on_floor()

	# Mantle when airborne and pushing toward a ledge.
	if not is_on_floor() and has_input:
		_try_start_mantle()


func _process_mantle(delta: float) -> void:
	_mantle_time += delta
	var t := clampf(_mantle_time / tuning.mantle_duration, 0.0, 1.0)
	# Rise first (ease out), then move over the edge (ease in).
	var pos := Vector3(
		lerpf(_mantle_from.x, _mantle_to.x, t * t),
		lerpf(_mantle_from.y, _mantle_to.y, 1.0 - (1.0 - t) * (1.0 - t)),
		0.0)
	global_position = pos
	velocity = Vector3.ZERO
	if t >= 1.0:
		_was_on_floor = true
		_set_state(State.NORMAL)


func _process_ladder(delta: float, move: Vector2) -> void:
	if _ladder == null or not is_instance_valid(_ladder):
		_set_state(State.NORMAL)
		return

	# Jump off.
	if _jump_just_pressed():
		var side := signf(move.x) if absf(move.x) > 0.1 else -float(_ladder.exit_direction)
		facing = side
		velocity = Vector3(side * tuning.ladder_jump_off_speed,
			tuning.jump_velocity() * tuning.ladder_jump_strength, 0.0)
		_can_cut_jump = false
		_leave_ladder()
		return

	# Slide onto the ladder's centre line.
	global_position.x = move_toward(global_position.x, _ladder.global_position.x, 8.0 * delta)

	var top := _ladder.top_y()
	# Reached the top while climbing up: step off onto the platform.
	if move.y > 0.1 and global_position.y >= top - 0.15:
		if _try_ladder_dismount():
			return
		global_position.y = minf(global_position.y, top)
		velocity = Vector3.ZERO
		return

	velocity = Vector3(0.0, move.y * tuning.climb_speed, 0.0)
	move_and_slide()
	global_position.y = minf(global_position.y, top)

	# Reached the bottom while climbing down.
	if move.y < -0.1 and is_on_floor():
		_leave_ladder()


func _process_push(delta: float, move: Vector2) -> void:
	if (_block == null or not is_instance_valid(_block) or not _interact_held()
			or not is_on_floor() or not _block.is_on_floor()):
		_release_block()
		_set_state(State.NORMAL)
		return

	# Facing stays locked toward the block.
	var block_side := signf(_block.global_position.x - global_position.x)
	facing = block_side
	var dir := signf(move.x) if absf(move.x) > 0.1 else 0.0
	var pushing := dir == block_side

	var before_x := global_position.x
	if pushing:
		# Move the block first; the Keeper follows only as far as it went.
		var moved := _block.try_move_x(dir * tuning.push_speed * delta)
		velocity.x = moved / delta
	else:
		velocity.x = dir * tuning.pull_speed
	velocity.y -= tuning.gravity() * delta
	move_and_slide()
	if dir != 0.0 and not pushing:
		# Pulling: the block follows the Keeper.
		_block.try_move_x(global_position.x - before_x)

	# Lost contact (block snagged, Keeper blocked): let go.
	var gap := absf(_block.global_position.x - global_position.x) - _radius - _block.half_width()
	if gap > tuning.grab_distance + 0.2:
		_release_block()
		_set_state(State.NORMAL)


# --- Helpers ------------------------------------------------------------------

func _set_state(new_state: State) -> void:
	if new_state == state:
		return
	state = new_state
	if new_state != State.PUSH:
		_block = null
	if new_state != State.LADDER:
		_ladder = null
	state_changed.emit(new_state)


func _release_block() -> void:
	_block = null
	if state == State.PUSH:
		_set_state(State.NORMAL)


func _try_start_mantle() -> bool:
	var space := get_world_3d().direct_space_state
	var feet := global_position
	# Look straight down just in front of the Keeper for a ledge top in reach.
	var probe_x := feet.x + facing * (_radius + 0.3)
	var ray := PhysicsRayQueryParameters3D.create(
		Vector3(probe_x, feet.y + tuning.mantle_reach, 0.0),
		Vector3(probe_x, feet.y + tuning.mantle_min_height, 0.0),
		MANTLE_MASK, [get_rid()])
	var hit := space.intersect_ray(ray)
	if hit.is_empty() or (hit.normal as Vector3).y < 0.7:
		return false

	var ledge_y: float = (hit.position as Vector3).y
	var target := Vector3(feet.x + facing * (_radius + 0.35), ledge_y + 0.02, 0.0)
	if not _fits_at(target):
		return false

	_mantle_from = feet
	_mantle_to = target
	_mantle_time = 0.0
	velocity = Vector3.ZERO
	_set_state(State.MANTLE)
	return true


func _try_grab_ladder(move: Vector2, on_floor: bool) -> bool:
	if _ladder_regrab_timer > 0.0 or _nearby_ladders.is_empty():
		return false
	for ladder in _nearby_ladders:
		var top := ladder.top_y()
		var below_top := global_position.y < top - 0.3
		# Climb up from below, or climb down from standing on top.
		if (move.y > 0.5 and below_top) or (move.y < -0.5 and on_floor and not below_top):
			_ladder = ladder
			velocity = Vector3.ZERO
			if not below_top:
				# Step off the platform edge onto the top of the ladder.
				global_position = Vector3(ladder.global_position.x, top - 0.35, 0.0)
			_set_state(State.LADDER)
			return true
	return false


func _try_ladder_dismount() -> bool:
	var side := float(_ladder.exit_direction)
	var target := Vector3(_ladder.global_position.x + side * (_ladder.half_width() + _radius + 0.3),
		_ladder.top_y() + 0.02, 0.0)
	if not _fits_at(target):
		return false
	facing = side
	_mantle_from = global_position
	_mantle_to = target
	_mantle_time = 0.0
	_set_state(State.MANTLE)
	return true


func _leave_ladder() -> void:
	_ladder_regrab_timer = LADDER_REGRAB_DELAY
	_set_state(State.NORMAL)


## True if the Keeper's body would fit with its feet at `feet_position`.
func _fits_at(feet_position: Vector3) -> bool:
	var query := PhysicsShapeQueryParameters3D.new()
	query.shape = _collision.shape
	query.transform = Transform3D(Basis(), feet_position + _collision.position)
	query.collision_mask = BODY_MASK
	query.exclude = [get_rid()]
	return get_world_3d().direct_space_state.intersect_shape(query, 1).is_empty()


func _find_block_in_front() -> PushableBlock:
	var origin := global_position + Vector3(0.0, 0.5, 0.0)
	var ray := PhysicsRayQueryParameters3D.create(origin,
		origin + Vector3(facing * (_radius + tuning.grab_distance), 0.0, 0.0),
		LAYER_PUSHABLE, [get_rid()])
	var hit := get_world_3d().direct_space_state.intersect_ray(ray)
	if hit.is_empty():
		return null
	return hit.collider as PushableBlock


func _update_visual(delta: float) -> void:
	var target_yaw := 0.0 if facing > 0.0 else PI
	_visual.rotation.y = lerp_angle(_visual.rotation.y, target_yaw, 1.0 - exp(-18.0 * delta))


# --- Input --------------------------------------------------------------------

func _read_move_input() -> Vector2:
	if not input_enabled:
		return Vector2.ZERO
	return Vector2(Input.get_axis("move_left", "move_right"),
		Input.get_axis("move_down", "move_up"))


func _jump_just_pressed() -> bool:
	return input_enabled and Input.is_action_just_pressed("jump")


func _jump_held() -> bool:
	return input_enabled and Input.is_action_pressed("jump")


func _interact_held() -> bool:
	return input_enabled and Input.is_action_pressed("interact")
