extends Node
## Global signal bus (autoload: GameEvents).
##
## Gameplay systems emit here; audio, UI, radio and level scripts listen here.
## This keeps lanes decoupled: Axel's audio never needs a reference to the
## Shadow node, it just connects to GameEvents.shadow_detached.
##
## Owner: Lucas. Adding a signal is fine for anyone; tell the team in chat.
## Renaming or removing one breaks other people's code, so ask first.

# --- Keeper -----------------------------------------------------------------

## The Keeper landed after a fall. `fall_speed` is in m/s (for footstep/thud volume).
signal keeper_landed(fall_speed: float)
## The Keeper's health changed. Used by the HUD.
signal keeper_health_changed(current: int, maximum: int)
## The Keeper died. Respawn flow starts after this.
signal keeper_died

# --- Shadow -----------------------------------------------------------------

## The Shadow left the Keeper. Axel's whisper audio starts here.
signal shadow_detached
## The Shadow returned (manual recall or tether snap).
signal shadow_recalled
## Emitted every frame while detached. `seconds` drives whisper intensity.
signal shadow_detach_time(seconds: float)
## `tension` is 0..1: how close the Shadow is to the tether limit (HUD tether indicator).
signal shadow_tether_tension(tension: float)
## Active control switched. `controlling_shadow` is true when the player drives the Shadow.
signal control_switched(controlling_shadow: bool)
## The Shadow changed ability (e.g. "solidify", "path_anchor"); "" when none is active.
signal shadow_ability_changed(ability: StringName)

# --- Combat -----------------------------------------------------------------

## A Light Strike hit something. `combo_step` is 1..3.
signal light_strike_hit(target: Node, combo_step: int)
## Flare Pulse fired. Used for the burst VFX, SFX and HUD cooldown.
signal flare_pulse_fired(position: Vector3)
## Flare Pulse cooldown progress, 0 = just used, 1 = ready.
signal flare_pulse_cooldown(progress: float)
## An enemy died. `enemy_type` is e.g. "skitterer", "shroud_warden".
signal enemy_killed(enemy_type: StringName, position: Vector3)

# --- Light & puzzles --------------------------------------------------------

## A light beam started hitting a valid receiver (crystal chime).
signal beam_hit_target(target: Node)
## A light beam stopped hitting that receiver.
signal beam_left_target(target: Node)
## A puzzle element changed state (plate pressed, gate opened...). `id` is set per instance.
signal puzzle_state_changed(id: StringName, active: bool)

# --- Progression ------------------------------------------------------------

## The player touched a checkpoint.
signal checkpoint_reached(checkpoint_id: StringName)
## A signal relay was restored. Axel's radio plays the matching log.
signal relay_restored(relay_index: int)
## The player moved between indoor and outdoor zones (rain muffling).
signal environment_zone_changed(is_indoors: bool)
