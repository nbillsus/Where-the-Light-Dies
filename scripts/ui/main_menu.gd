extends Control

const PROTOTYPE_LEVEL := "res://scenes/levels/PrototypeLevel.tscn"

func _ready() -> void:
	$Content/StartButton.pressed.connect(_start_prototype)
	$Content/StartButton.grab_focus()

func _unhandled_key_input(event: InputEvent) -> void:
	if event.is_pressed() and event.is_action("ui_accept"):
		_start_prototype()

func _start_prototype() -> void:
	get_tree().change_scene_to_file(PROTOTYPE_LEVEL)
