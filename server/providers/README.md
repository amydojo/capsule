# Capsule Model Providers

These modules define provider contracts only. They do not call external models, download weights, or require new environment variables.

Current providers are unavailable stubs for:

- vision
- segmentation
- depth
- embedding

`unavailable` is a valid provider state. Preservation must continue when a provider is unavailable or returns an error.

Future adapters for systems like SAM, Grounding DINO, Depth Anything, Qwen, or hosted embedding models should implement the same provider object shape and return the same result fields. Provider outputs can map into Artifact Record v2 `modelProvenance` without changing the saved artifact route or Vault storage contract.
