class_name KeeperTuning
extends Resource
## Every movement number for The Keeper, in one place.
##
## Edit `scenes/player/keeper_tuning.tres` in the Inspector to tune the feel.
## Distances are metres, times are seconds, speeds are metres per second.
## The rules these numbers implement are written up in docs/MECHANICS.md.

@export_group("Run")
## Top running speed.
@export var run_speed := 5.0
## How fast the Keeper reaches run speed on the ground.
@export var ground_accel := 45.0
## How fast the Keeper stops on the ground when the stick is released.
@export var ground_decel := 55.0
## Steering speed while in the air.
@export var air_accel := 28.0
## Slowdown in the air with no input (low = keeps momentum).
@export var air_decel := 8.0

@export_group("Jump")
## Height of a full (held) jump.
@export var jump_height := 1.4
## Time from takeoff to the top of a full jump.
@export var time_to_apex := 0.38
## Upward speed is multiplied by this when jump is released early (short hop).
@export_range(0.0, 1.0) var jump_cut := 0.45
## Gravity multiplier while falling, so jumps feel heavy rather than floaty.
@export var fall_gravity_multiplier := 1.6
@export var max_fall_speed := 20.0
## Grace time to still jump after running off an edge.
@export var coyote_time := 0.1
## A jump pressed this long before landing still happens on landing.
@export var jump_buffer_time := 0.12

@export_group("Mantle")
## Highest ledge the Keeper can grab, measured from the feet.
@export var mantle_reach := 2.0
## Lowest ledge that triggers a mantle (anything lower is just jumped onto).
@export var mantle_min_height := 0.35
## How long the pull-up takes.
@export var mantle_duration := 0.28

@export_group("Ladder")
@export var climb_speed := 3.0
## Sideways speed when jumping off a ladder.
@export var ladder_jump_off_speed := 4.0
## Fraction of a normal jump used when leaving a ladder.
@export_range(0.0, 1.0) var ladder_jump_strength := 0.6

@export_group("Push and pull")
@export var push_speed := 2.0
@export var pull_speed := 1.6
## How close the Keeper must be to a block to grab it.
@export var grab_distance := 0.45


## Gravity that produces `jump_height` in `time_to_apex`.
func gravity() -> float:
	return 2.0 * jump_height / (time_to_apex * time_to_apex)


## Takeoff speed for a full jump.
func jump_velocity() -> float:
	return 2.0 * jump_height / time_to_apex
