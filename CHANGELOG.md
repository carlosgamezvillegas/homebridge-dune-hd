# Changelog
## [2.0.0] - 2026-05-02
- Homebridge 2.0 support
- Improved polling reliability by preventing overlapping `getDeviceInfo` HTTP polls while a prior poll is still in flight.
- Added safer integer parsing via `toInt()` and replaced fragile `parseInt(...)` usage in playback/metadata processing paths.
- Hardened unknown remote-button handling so invalid button names no longer produce malformed IR URLs.
- Updated several loose comparisons to strict comparisons in polling/history logic.
- Refactored `commandName()` and `pressedButton()` to use one shared remote-command definition map.
- Added centralized IR token mappings (`REMOTE_COMMAND_DEFINITIONS`) and derived lookup tables for labels and button-to-code resolution.
- Removed the large duplicated switch/if chains for command decoding and button IR code generation while preserving command behavior.
- Refactored repetitive service creation in `index.js` using shared builder methods for stateful switches, stateless switches, and dual-mode dimmer/fan controls.
- Added a declarative `STATELESS_SWITCH_CONFIGS` table and centralized stateless switch build/remove logic.
- Replaced repeated optional-service cleanup blocks with `cleanupDisabledServices()` and safe removal handling.
- Added helper methods for movie progress seeking and dual-mode control wiring to reduce duplicated callback code.
- Improved reliability in `index.js` by fixing multiple logic bugs in playback-state checks and power-on response handling.
- Hardened HTTP request handling with URL validation, timeout handling, HTTP error logging, and safer JSON parsing.
- Fixed command routing mismatch for the HomeKit EXIT key (now maps to a valid Dune command).
- Removed redundant characteristic update calls and cleaned ambiguous/unreachable command-name branches.
- Corrected user-facing typos in language names and runtime log text.
- Added `createInputSourceService()` and `getOrCreateInputSource(definition)` helper methods to centralize InputSource creation/linking logic.
- Replaced constructor inline InputSource setup with a single `this.buildInputSources()` call.
- Added inline comments for the new input-source helpers and constructor call site.
- Reordered class methods alphabetically (constructor kept first) in both `duneHDPlatform` and `duneHDAccessory` for consistent structure.

## [1.3.1] - 2024-05-23
- Bug fixes
## [1.3.0] - 2024-05-23
- Bug fixes
- Added the option to change the Info button in the Remote to the Menu button
- Movie Timer as a Valve accessory
## [1.2.3] - 2023-06-26
- Port number now can be changed (hopefully this will enable the use of the plug-in with other Dune HD models)
## [1.2.2] - 2023-01-26
- Bug fixes 
## [1.2.0] - 2023-08-31
- Added the ability to change the Volume and Movie Progress controls from Dimmers to Fans
## [1.1.1] - 2022-08-07
- Bug fixes and performance improvements
## [1.1.0] - 2022-06-04
- Fixed Movie Title and Duration for Blu-ray and DVD movies
## [1.0.1] - 2022-05-10
- Homebridge Verified badge added
## [1.0.0] - 2022-04-16
- General performance and stability improvements
- Bug fixes
## [0.1.2] - 2022-04-09
- General performance and stability improvements
## [0.1.0] - 2022-03-18
- First Plug-in release
