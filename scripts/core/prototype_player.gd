extends Node2D

const SPEED := 300.0
const JUMP_VELOCITY := -470.0
const GRAVITY := 1300.0
const FLOOR_Y := 547.0
const PLATFORMS := [Rect2(350, 457, 160, 22), Rect2(650, 386, 145, 22), Rect2(915, 332, 135, 22)]

var velocity := Vector2.ZERO
var grounded := false

func _ready() -> void:
	queue_redraw()

func _physics_process(delta: float) -> void:
	var direction := Input.get_axis("ui_left", "ui_right")
	if Input.is_key_pressed(KEY_A):
		direction -= 1.0
	if Input.is_key_pressed(KEY_D):
		direction += 1.0
	velocity.x = move_toward(velocity.x, direction * SPEED, SPEED * 8.0 * delta)
	velocity.y += GRAVITY * delta
	if grounded and Input.is_action_just_pressed("ui_accept"):
		velocity.y = JUMP_VELOCITY
		grounded = false

	var previous_y := position.y
	position += velocity * delta
	grounded = false
	var landing_y := FLOOR_Y
	for platform in PLATFORMS:
		if position.x >= platform.position.x - 12.0 and position.x <= platform.end.x + 12.0 and velocity.y >= 0.0 and previous_y <= platform.position.y and position.y >= platform.position.y:
			landing_y = minf(landing_y, platform.position.y)
	if position.y >= landing_y:
		position.y = landing_y
		velocity.y = 0.0
		grounded = true
	position.x = clampf(position.x, 25.0, 1255.0)
	queue_redraw()

func _draw() -> void:
	# A neutral silhouette placeholder, not production character art.
	draw_circle(Vector2(0, -29), 13, Color("d6b66b"))
	draw_rect(Rect2(-13, -16, 26, 32), Color("18202b"))
	draw_line(Vector2(-8, 15), Vector2(-11, 28), Color("10151c"), 6.0)
	draw_line(Vector2(8, 15), Vector2(11, 28), Color("10151c"), 6.0)
	draw_circle(Vector2(17, -5), 13, Color(1.0, 0.64, 0.18, 0.16))
	draw_circle(Vector2(17, -5), 4, Color("f4ad48"))
