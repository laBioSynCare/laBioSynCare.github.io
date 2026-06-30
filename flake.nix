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
          py = pkgs.python312;

          # pySHACL and its OWL-RL dependency are not currently packaged in
          # nixpkgs (confirmed against the pinned revision and the registry —
          # `nix search nixpkgs shacl` is empty), so we vendor both from PyPI.
          # This also pins exact validator versions, which the old unpinned CI
          # `pip install pyshacl` never did. Bump version + hash to upgrade.
          owlrl = py.pkgs.buildPythonPackage rec {
            pname = "owlrl";
            version = "6.0.2";
            pyproject = true;
            src = pkgs.fetchPypi {
              inherit pname version;
              hash = "sha256-kE4zEP9N8VEBR1d2aT0kJ9H4JE7ppqn54Tw8V/rpC3Q=";
            };
            build-system = [ py.pkgs.setuptools ];
            dependencies = [ py.pkgs.rdflib ];
            dontCheckRuntimeDeps = true;
            doCheck = false;
            pythonImportsCheck = [ "owlrl" ];
          };

          pyshacl = py.pkgs.buildPythonApplication rec {
            pname = "pyshacl";
            version = "0.26.0";
            pyproject = true;
            src = pkgs.fetchPypi {
              inherit pname version;
              hash = "sha256-SNRPMXzZqtjj/bXfiqVwb6ktxrJ0ZBlpgDXoSjIPuJ0=";
            };
            build-system = [ py.pkgs.poetry-core ];

            # nixpkgs ships poetry-core 2.x; pySHACL 0.26.0 caps it at <2 out of
            # caution, but it builds cleanly with v2. Drop the cap so the wheel
            # build's dependency check passes. (Both spellings handled.)
            postPatch = ''
              substituteInPlace pyproject.toml \
                --replace-quiet "poetry-core>=1.9.0,<2.0.0" "poetry-core>=1.9.0" \
                --replace-quiet "poetry-core>=1.9.0,<2" "poetry-core>=1.9.0"
            '';

            dependencies = [
              py.pkgs.rdflib
              owlrl
              py.pkgs.prettytable
              py.pkgs.packaging
            ];
            # We supply nixpkgs' rdflib (7.x); ignore pySHACL's own pins/extras.
            dontCheckRuntimeDeps = true;
            doCheck = false; # upstream test suite needs bundled fixtures
            pythonImportsCheck = [ "pyshacl" ];
            meta.mainProgram = "pyshacl";
          };
        in
        {
          default = pkgs.mkShell {
            name = "bsc-lab";

            packages = [
              pkgs.nodejs_24      # matches CI (.github/workflows) and package.json
              (py.withPackages (ps: [ ps.rdflib ]))  # python3.12 + rdflib — `make export`, ad-hoc use
              pyshacl             # vendored `pyshacl` CLI — SHACL for `make validate`
              pkgs.wabt           # wat2wasm for `make wasm` (bsc-osc.wat → .wasm)
              pkgs.gnumake        # the canonical task entrypoint (Makefile)
              pkgs.firebase-tools # `make deploy-firestore-rules` without npx
            ];

            shellHook = ''
              echo "BSC Lab dev shell — $(node --version) node, $(python3 --version), wabt $(wat2wasm --version)"
              echo "Run 'make help' for available targets."
            '';
          };
        });

      # `nix fmt` formats the Nix sources in this repo.
      formatter = forAllSystems (pkgs: pkgs.nixpkgs-fmt);
    };
}
