extends Node2D

const MENU_SCENE := "res://scenes/ui/MainMenu.tscn"

func _ready() -> void:
	queue_redraw()

func _unhandled_key_input(event: InputEvent) -> void:
	if event.is_pressed() and event.is_action("ui_cancel"):
		get_tree().change_scene_to_file(MENU_SCENE)

func _draw() -> void:
	# Intentionally simple, code-drawn graybox art for the shared prototype.
	draw_rect(Rect2(0, 0, 1280, 720), Color("07111e"))
	draw_circle(Vector2(1000, 130), 46, Color(0.82, 0.74, 0.53, 0.16))
	draw_circle(Vector2(1000, 130), 22, Color(1.0, 0.78, 0.32, 0.7))

	# Distant rain bands and ocean.
	for x in range(-100, 1350, 72):
		draw_line(Vector2(x, 120), Vector2(x - 120, 400), Color(0.28, 0.42, 0.55, 0.14), 2.0)
	draw_rect(Rect2(0, 555, 1280, 165), Color("0b2637"))
	for y in range(590, 710, 24):
		draw_line(Vector2(0, y), Vector2(1280, y - 12), Color(0.24, 0.47, 0.57, 0.25), 2.0)

	# Playable walkways: ground plus three modest platforms.
	draw_rect(Rect2(0, 575, 1280, 32), Color("26333b"))
	draw_rect(Rect2(0, 607, 1280, 10), Color("141c24"))
	draw_rect(Rect2(350, 485, 160, 22), Color("34414a"))
	draw_rect(Rect2(650, 414, 145, 22), Color("34414a"))
	draw_rect(Rect2(915, 360, 135, 22), Color("34414a"))
	for platform in [Rect2(350, 485, 160, 22), Rect2(650, 414, 145, 22), Rect2(915, 360, 135, 22)]:
		draw_line(platform.position, Vector2(platform.end.x, platform.position.y), Color(0.7, 0.57, 0.31, 0.65), 2.0)

	# Lighthouse silhouette, door, and an inactive beacon.
	draw_colored_polygon(PackedVector2Array([Vector2(1040, 575), Vector2(1195, 575), Vector2(1168, 210), Vector2(1068, 210)]), Color("1b2630"))
	draw_rect(Rect2(1052, 195, 132, 28), Color("27333a"))
	draw_rect(Rect2(1087, 488, 39, 87), Color("10161b"))
	draw_line(Vector2(1087, 488), Vector2(1126, 488), Color(0.83, 0.63, 0.27, 0.55), 2.0)
	draw_string(ThemeDB.fallback_font, Vector2(1066, 470), "BEACON DOOR", HORIZONTAL_ALIGNMENT_LEFT, -1, 13, Color(0.71, 0.71, 0.63, 0.7))

	# Warm guide lamps are placeholders for future lighting gameplay.
	for lamp in [Vector2(300, 550), Vector2(590, 550), Vector2(850, 550)]:
		draw_circle(lamp, 26, Color(1.0, 0.61, 0.16, 0.10))
		draw_circle(lamp, 5, Color(1.0, 0.68, 0.24, 0.9))
