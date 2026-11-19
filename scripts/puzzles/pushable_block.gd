class_name PushableBlock
extends CharacterBody3D
## A heavy crate the Keeper can push and pull. Drop
## scenes/puzzles/pushable_block.tscn into a level.
##
## It falls under gravity, cannot be pushed through walls, and only moves when
## the Keeper is holding it. The origin is at the bottom centre.
##
## Owner: Lucas (behaviour). Neel places them.

const GRAVITY := 25.0
const MAX_FALL_SPEED := 20.0

@onready var _collision: CollisionShape3D = $CollisionShape3D


func _physics_process(delta: float) -> void:
	velocity.x = 0.0
	velocity.z = 0.0
	if is_on_floor():
		velocity.y = -0.5
	else:
		velocity.y = maxf(velocity.y - GRAVITY * delta, -MAX_FALL_SPEED)
	move_and_slide()
	global_position.z = 0.0


## Tries to slide sideways by `dx` metres. Returns how far it actually moved.
func try_move_x(dx: float) -> float:
	if is_zero_approx(dx):
		return 0.0
	var before := global_position.x
	# Stops at walls and other blocks; whatever distance was covered counts.
	move_and_collide(Vector3(dx, 0.0, 0.0))
	global_position.z = 0.0
	return global_position.x - before


func half_width() -> float:
	return (_collision.shape as BoxShape3D).size.x * 0.5
