{
  description = "BSC Lab — open sensory stimulation platform and RDF knowledge graph browser";

  # Single pinned input. flake.lock records the exact nixpkgs revision so the
  # toolchain is byte-reproducible across contributor machines and CI.
  # Regenerate the pin with:  nix flake update
  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";

  outputs = { self, nixpkgs }:
    let
      # Tier-1 dev/CI platforms: Linux + Apple Silicon/Intel macOS.
      systems = [ "x86_64-linux" "aarch64-linux" "x86_64-darwin" "aarch64-darwin" ];
      forAllSystems = f: nixpkgs.lib.genAttrs systems (system: f (import nixpkgs { inherit system; }));
    in
    {
      # `nix develop` / direnv `use flake` — the canonical BSC Lab dev environment.
      devShells = forAllSystems (pkgs:
        let
          # Python with pySHACL, pinned by the lock alongside everything else.
          # This is the toolchain that produces the ontology validation reports,
          # so its version must be reproducible — see Makefile `shacl-*` targets.
          python = pkgs.python312.withPackages (ps: [ ps.pyshacl ]);
        in
        {
          default = pkgs.mkShell {
            name = "bsc-lab";

            packages = [
              pkgs.nodejs_24      # matches CI (.github/workflows) and package.json
              python              # python3.12 + pyshacl for `make validate`
              pkgs.wabt           # wat2wasm for `make wasm` (bsc-osc.wat → .wasm)
              pkgs.gnumake        # the canonical task entrypoint (Makefile)
              pkgs.firebase-tools # `make deploy-firestore-rules` without npx
            ];

            shellHook = ''
              echo "BSC Lab dev shell — node $(node --version), $(python --version), wabt $(wat2wasm --version)"
              echo "Run 'make help' for available targets."
            '';
          };
        });

      # `nix fmt` formats the Nix sources in this repo.
      formatter = forAllSystems (pkgs: pkgs.nixpkgs-fmt);
    };
}
