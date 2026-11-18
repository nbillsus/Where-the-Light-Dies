extends Node
## Automated check of The Keeper's movement in the sandbox test course.
##
## Run from the repo root:
##   godot --headless res://tests/test_keeper_movement.tscn
## Exits with code 0 when everything passes, 1 otherwise.

const SANDBOX := "res://scenes/sandbox/sandbox.tscn"

var keeper: Keeper
var crate: PushableBlock
var failures := 0
var landings := 0


## Give up if the test hangs.
const TIMEOUT_SECONDS := 60.0


func _ready() -> void:
	get_tree().create_timer(TIMEOUT_SECONDS).timeout.connect(func() -> void:
		print("TIMED OUT")
		get_tree().quit(1))
	_run()


func _run() -> void:
	var sandbox: Node = (load(SANDBOX) as PackedScene).instantiate()
	add_child(sandbox)
	keeper = sandbox.get_node("Keeper")
	crate = sandbox.get_node("Crate")
	GameEvents.keeper_landed.connect(func(_speed: float) -> void: landings += 1)
	await _frames(20)

	await _test_run()
	await _test_jump_heights()
	await _test_mantle()
	await _test_wall_too_high()
	await _test_ladder()
	await _test_push_pull()
	await _test_input_disabled()

	print("\n%s (%d failed)" % ["ALL PASSED" if failures == 0 else "FAILURES", failures])
	get_tree().quit(1 if failures > 0 else 0)


func _test_run() -> void:
	print("-- run")
	_reset(Vector3(-16, 0, 0))
	await _frames(10)
	_check(keeper.is_on_floor(), "starts on the floor")
	Input.action_press("move_right")
	# 40 frames: long enough to reach top speed, short enough not to hit the crate.
	await _frames(40)
	_check_near(keeper.velocity.x, keeper.tuning.run_speed, 0.05, "reaches run speed")
	_check_near(keeper.global_position.z, 0.0, 0.001, "stays on the Z = 0 plane")
	Input.action_release("move_right")
	await _frames(30)
	_check_near(keeper.velocity.x, 0.0, 0.01, "stops when input is released")


func _test_jump_heights() -> void:
	print("-- jump")
	_reset(Vector3(-16, 0, 0))
	await _frames(10)
	landings = 0
	var full := await _measure_jump(60)
	_check_range(full, 1.25, 1.5, "held jump reaches about jump_height (%.2f m)" % full)
	_check(landings >= 1, "keeper_landed event fires on landing")
	await _frames(30)
	var hop := await _measure_jump(3)
	_check_range(hop, 0.1, 0.8, "tapped jump is a short hop (%.2f m)" % hop)


func _test_mantle() -> void:
	print("-- mantle")
	# The ledge spans x -7 .. -4 and is 1.5 m tall.
	_reset(Vector3(-8.5, 0, 0))
	await _frames(10)
	Input.action_press("move_right")
	Input.action_press("jump")
	# Let go once the mantle is done so the Keeper doesn't walk off the far side.
	await _frames(30)
	Input.action_release("jump")
	Input.action_release("move_right")
	await _frames(30)
	_check_near(keeper.global_position.y, 1.5, 0.05, "mantles up onto the 1.5 m ledge")
	_check(keeper.global_position.x > -7.0, "ends up on top of the ledge")
	_check(keeper.state == Keeper.State.NORMAL, "back to normal state after mantling")


func _test_wall_too_high() -> void:
	print("-- shadow wall")
	# The wall starts at x 14 and is 4.2 m tall: out of reach without the Shadow.
	_reset(Vector3(12.5, 0, 0))
	await _frames(10)
	Input.action_press("move_right")
	Input.action_press("jump")
	await _frames(90)
	Input.action_release("jump")
	Input.action_release("move_right")
	await _frames(30)
	_check(keeper.global_position.y < 0.1 and keeper.global_position.x < 14.0,
		"cannot climb the 4.2 m wall alone")


func _test_ladder() -> void:
	print("-- ladder")
	# Ladder at x 1.5 leads to a 4 m platform on its right.
	_reset(Vector3(1.0, 0, 0))
	await _frames(10)
	Input.action_press("move_up")
	await _frames(120)
	Input.action_release("move_up")
	await _frames(20)
	_check_near(keeper.global_position.y, 4.0, 0.05, "climbs to the top of the ladder")
	_check(keeper.global_position.x > 2.0, "steps off onto the platform")
	_check(keeper.state == Keeper.State.NORMAL, "back to normal state on the platform")

	# Climb back down from the platform.
	_reset(Vector3(2.4, 4.0, 0))
	await _frames(10)
	Input.action_press("move_down")
	await _frames(15)
	_check(keeper.state == Keeper.State.LADDER, "grabs the ladder from the platform")
	await _frames(120)
	Input.action_release("move_down")
	await _frames(10)
	_check_near(keeper.global_position.y, 0.0, 0.05, "climbs down to the floor")
	_check(keeper.state == Keeper.State.NORMAL, "lets go at the bottom")

	# Jump off part-way up.
	_reset(Vector3(1.0, 0, 0))
	await _frames(10)
	Input.action_press("move_up")
	await _frames(30)
	Input.action_release("move_up")
	Input.action_press("move_left")
	Input.action_press("jump")
	await _frames(2)
	Input.action_release("jump")
	_check(keeper.state == Keeper.State.NORMAL and keeper.velocity.x < 0.0,
		"can jump off the ladder to the side")
	Input.action_release("move_left")
	await _frames(60)


func _test_push_pull() -> void:
	print("-- push / pull")
	# Crate starts at x -11 (1 m wide).
	crate.global_position = Vector3(-11, 0, 0)
	_reset(Vector3(-12.1, 0, 0))
	keeper.facing = 1.0
	await _frames(10)
	Input.action_press("interact")
	await _frames(3)
	_check(keeper.state == Keeper.State.PUSH, "grabs the crate with interact")
	Input.action_press("move_right")
	await _frames(60)
	Input.action_release("move_right")
	_check_near(crate.global_position.x, -11.0 + keeper.tuning.push_speed, 0.15,
		"pushes the crate at push_speed (crate x %.2f)" % crate.global_position.x)
	var pushed_x := crate.global_position.x
	Input.action_press("move_left")
	await _frames(60)
	Input.action_release("move_left")
	_check_near(crate.global_position.x, pushed_x - keeper.tuning.pull_speed, 0.15,
		"pulls the crate at pull_speed (crate x %.2f)" % crate.global_position.x)
	Input.action_release("interact")
	await _frames(3)
	_check(keeper.state == Keeper.State.NORMAL, "lets go when interact is released")
	var before := crate.global_position.x
	Input.action_press("move_right")
	await _frames(30)
	Input.action_release("move_right")
	_check_near(crate.global_position.x, before, 0.01, "crate does not move by walking into it")


func _test_input_disabled() -> void:
	print("-- input disabled (Shadow has control)")
	_reset(Vector3(-16, 0, 0))
	await _frames(10)
	keeper.input_enabled = false
	Input.action_press("move_right")
	Input.action_press("jump")
	await _frames(30)
	Input.action_release("jump")
	Input.action_release("move_right")
	_check_near(keeper.global_position.x, -16.0, 0.01, "ignores input when disabled")
	keeper.input_enabled = true


# --- Helpers ------------------------------------------------------------------

func _measure_jump(hold_frames: int) -> float:
	var start_y := keeper.global_position.y
	var peak := start_y
	Input.action_press("jump")
	for i in 90:
		if i == hold_frames:
			Input.action_release("jump")
		await get_tree().physics_frame
		peak = maxf(peak, keeper.global_position.y)
	Input.action_release("jump")
	return peak - start_y


func _reset(feet: Vector3) -> void:
	for action in ["move_left", "move_right", "move_up", "move_down", "jump", "interact"]:
		Input.action_release(action)
	keeper.teleport(feet)


func _frames(count: int) -> void:
	for i in count:
		await get_tree().physics_frame


func _check(condition: bool, label: String) -> void:
	print(("  PASS  " if condition else "  FAIL  ") + label)
	if not condition:
		failures += 1


func _check_near(value: float, expected: float, tolerance: float, label: String) -> void:
	var ok := absf(value - expected) <= tolerance
	_check(ok, label if ok else "%s (got %.3f, expected %.3f)" % [label, value, expected])


func _check_range(value: float, low: float, high: float, label: String) -> void:
	_check(value >= low and value <= high, label)
