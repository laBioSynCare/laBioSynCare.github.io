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

          # HED validation for ADR 0025. `hedtools` is the reference
          # implementation from the HED Working Group and is what ADR 0025
          # decision 7 means by "HED validation against the pinned schema" —
          # checking that a tag exists in the schema, which `make hed-crosswalk`
          # already does, is not the same as validating HED syntax. Two of its
          # dependencies are also absent from nixpkgs, so all three are vendored
          # from PyPI here on the same pattern as pySHACL. Bump version + hash to
          # upgrade; the HED *schema* version is pinned separately, in
          # static/schemas/sstim-hed-event-map.json.
          click-option-group = py.pkgs.buildPythonPackage rec {
            pname = "click_option_group";
            version = "0.5.9";
            pyproject = true;
            src = pkgs.fetchPypi {
              inherit pname version;
              hash = "sha256-+U7SvEz2kFLg8pWSvR53GheJvXv8SC3QvEghNK/5WCM=";
            };
            # hatchling + hatch-vcs, not setuptools. hatch-vcs derives the
            # version from git metadata that a PyPI sdist does not carry, so it
            # is supplied explicitly.
            build-system = with py.pkgs; [ hatchling hatch-vcs ];
            env.HATCH_VCS_PRETEND_VERSION = version;
            dependencies = [ py.pkgs.click ];
            dontCheckRuntimeDeps = true;
            doCheck = false;
            pythonImportsCheck = [ "click_option_group" ];
          };

          semantic-version = py.pkgs.buildPythonPackage rec {
            pname = "semantic_version";
            version = "2.10.0";
            pyproject = true;
            src = pkgs.fetchPypi {
              inherit pname version;
              hash = "sha256-vau20zaZjLs3jUuds6S1ah4yNXAdwF6iaQ2amX7VBBw=";
            };
            build-system = [ py.pkgs.setuptools ];
            dontCheckRuntimeDeps = true;
            doCheck = false;
            pythonImportsCheck = [ "semantic_version" ];
          };

          hedtools = py.pkgs.buildPythonPackage rec {
            pname = "hedtools";
            version = "1.2.0";
            pyproject = true;
            src = pkgs.fetchPypi {
              inherit pname version;
              hash = "sha256-7mHiWfMPDDPjfEqpRql/X7b6w5JlPN4CHPwzPF+vSNE=";
            };
            # setuptools-scm also derives the version from git; the sdist has
            # none, so it is pretended here.
            build-system = with py.pkgs; [ setuptools setuptools-scm ];
            env.SETUPTOOLS_SCM_PRETEND_VERSION = version;
            dependencies = with py.pkgs; [
              click defusedxml inflect numpy openpyxl pandas portalocker typeguard
            ] ++ [ click-option-group semantic-version ];
            dontCheckRuntimeDeps = true;
            doCheck = false;
            pythonImportsCheck = [ "hed" ];
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

          # pyLODE 2.13.2 — SKOS-aware HTML docs (vocpub profile) for the
          # vocabulary module. WIDOCO is OWL-centric; pyLODE renders SKOS
          # concept schemes. Pinned at 2.x (setuptools, deps all in nixpkgs);
          # 3.x pulls in kurra → shacl-rules/sparqlib, not worth the cascade.
          pylode = py.pkgs.buildPythonApplication rec {
            pname = "pyLODE";
            version = "2.13.2";
            format = "setuptools";
            src = pkgs.fetchPypi {
              inherit pname version;
              hash = "sha256-+NU+mbpvh7hly2yuuN+KrTxtc1cr/kIGq0fwl8g99kI=";
            };
            # The 2.13.2 sdist omits requirements.txt, which setup.py reads for
            # install_requires. Recreate it; nix supplies the deps below.
            preBuild = ''
              printf 'rdflib\nrequests\njinja2\nmarkdown\n' > requirements.txt
            '';
            dependencies = [
              py.pkgs.rdflib
              py.pkgs.requests
              py.pkgs.jinja2
              py.pkgs.markdown
            ];
            dontCheckRuntimeDeps = true;
            doCheck = false;
            pythonImportsCheck = [ "pylode" ];
            meta.mainProgram = "pylode";
          };

          robot = pkgs.stdenvNoCC.mkDerivation rec {
            pname = "robot";
            version = "1.9.10";

            src = pkgs.fetchurl {
              url = "https://github.com/ontodev/robot/releases/download/v${version}/robot.jar";
              hash = "sha256-Fqc8B08981mnM4qEtOB4h4X+BhF/kxu5eW6WGep3YQU=";
            };

            nativeBuildInputs = [ pkgs.makeWrapper ];
            dontUnpack = true;

            installPhase = ''
              runHook preInstall
              install -Dm444 "$src" "$out/share/java/robot.jar"
              makeWrapper ${pkgs.jre_headless}/bin/java "$out/bin/robot" \
                --add-flags "-jar $out/share/java/robot.jar"
              runHook postInstall
            '';

            meta = {
              description = "ROBOT ontology command-line tool";
              homepage = "https://robot.obolibrary.org/";
              license = pkgs.lib.licenses.bsd3;
              mainProgram = "robot";
              platforms = pkgs.lib.platforms.unix;
            };
          };

          widoco = pkgs.stdenvNoCC.mkDerivation rec {
            pname = "widoco";
            version = "1.4.25";

            # The release ships one fat jar per supported JDK; pick the JDK-17
            # build to match jre_headless.
            src = pkgs.fetchurl {
              url = "https://github.com/dgarijo/Widoco/releases/download/v${version}/widoco-${version}-jar-with-dependencies_JDK-17.jar";
              hash = "sha256-vleicP/7keVYEPowhxfnBKROLnwCej1oElpJ2myLTis=";
            };

            nativeBuildInputs = [ pkgs.makeWrapper ];
            dontUnpack = true;

            installPhase = ''
              runHook preInstall
              install -Dm444 "$src" "$out/share/java/widoco.jar"
              makeWrapper ${pkgs.jre_headless}/bin/java "$out/bin/widoco" \
                --add-flags "-jar $out/share/java/widoco.jar"
              runHook postInstall
            '';

            meta = {
              description = "WIDOCO ontology documentation generator";
              homepage = "https://github.com/dgarijo/Widoco";
              license = pkgs.lib.licenses.asl20;
              mainProgram = "widoco";
              platforms = pkgs.lib.platforms.unix;
            };
          };
        in
        {
          default = pkgs.mkShell {
            name = "bsc-lab";

            packages = [
              pkgs.nodejs_24      # matches CI (.github/workflows) and package.json
              (py.withPackages (ps: [ ps.rdflib ps.jsonschema hedtools ]))  # RDF tooling, manifest JSON Schema validation, HED validation (ADR 0025)
              pyshacl             # vendored `pyshacl` CLI — SHACL for `make validate`
              pylode              # vendored `pylode` CLI — SKOS vocab HTML docs (`make vocab-docs`)
              robot               # ROBOT + HermiT/ELK — OWL DL consistency for `make reason`
              widoco              # WIDOCO — ontology HTML reference docs for `make ontology-docs`
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

      # `nix build` — the static BSC Lab site as an immutable package.
      #
      # This closes gap G1 in docs/technical/PORTABLE_DEPLOYMENT.md and nothing
      # more. It is *not* self-hosting: there is deliberately no NixOS module,
      # no service definition and no container image yet. What it gives an
      # operator is a reproducible artifact they can serve with any static web
      # server, built from a pinned toolchain rather than from whatever Node
      # happened to be on the build machine.
      #
      # Credential-free by construction. The flake source is the git-tracked
      # tree, so an untracked, gitignored .env cannot enter the sandbox — the
      # build cannot inline a developer's Firebase key even by accident. That is
      # the same property `make smoke-static` asserts for ordinary builds, here
      # obtained structurally instead of by convention.
      packages = forAllSystems (pkgs: {
        default = pkgs.buildNpmPackage (finalAttrs: {
          pname = "bsc-lab";
          version = "0.1.0";           # tracks package.json
          src = self;

          # Regenerate after any package-lock.json change:
          #   nix build 2>&1 | grep -A2 'specified:'
          # or: nix run nixpkgs#prefetch-npm-deps -- package-lock.json
          npmDepsHash = "sha256-YmOSLoPaw/fMiW9D1oZUzKxfjah2xu8jL2YKwkX5aiQ=";

          nodejs = pkgs.nodejs_24;     # same major as the dev shell and CI

          # `npm run build` → vite build → dist/ (adapter-static).
          npmBuildScript = "build";

          # Pin SvelteKit's version name to the revision being built. Left to its
          # default it is a timestamp, which lands in every content hash and makes
          # the output differ on every run. A revision is stable for identical
          # sources and still changes whenever the source does, so the service
          # worker's cache name keeps invalidating correctly (ADR 0009).
          BSC_BUILD_VERSION = self.shortRev or self.dirtyShortRev or "unknown";

          # Vite would otherwise read a project-root .env in every mode. There is
          # none in the sandbox, but point envDir at an empty path so the intent
          # is explicit and a future stray file cannot change the output.
          preBuild = ''
            export BSC_ENV_DIR="$TMPDIR/bsc-empty-env"
            mkdir -p "$BSC_ENV_DIR"
          '';

          installPhase = ''
            runHook preInstall
            mkdir -p "$out/share/bsc-lab"
            cp -r dist/. "$out/share/bsc-lab/"
            runHook postInstall
          '';

          # Fail the build rather than ship an empty or credentialed artifact.
          doInstallCheck = true;
          installCheckPhase = ''
            runHook preInstallCheck
            test -f "$out/share/bsc-lab/index.html" \
              || { echo "no index.html in package output"; exit 1; }
            test -f "$out/share/bsc-lab/ontology/sstim-core.ttl" \
              || { echo "ontology assets missing from package output"; exit 1; }
            test -f "$out/share/bsc-lab/ontology/manifest.json" \
              || { echo "ontology manifest missing from package output"; exit 1; }
            grep -q 'bsc-lab-build-info-1' "$out/share/bsc-lab/build-info.json" \
              || { echo "package does not declare the commit it was built from"; exit 1; }
            if grep -rEq 'AIza[0-9A-Za-z_-]{20,}' "$out/share/bsc-lab"; then
              echo "a Firebase API key was inlined into the package output"; exit 1
            fi
            runHook postInstallCheck
          '';

          meta = {
            description = "BSC Lab — static sensory-stimulation workbench and SSTIM knowledge browser";
            homepage = "https://labiosyncare.github.io/";
            license = pkgs.lib.licenses.asl20;
            platforms = pkgs.lib.platforms.all;
          };
        });
      }
      # An OCI image for operators who do not run Nix. Linux-only, and built
      # from the *same* store path the NixOS module serves — the application is
      # never rebuilt for it, so the deployment paths cannot drift.
      // pkgs.lib.optionalAttrs pkgs.stdenv.hostPlatform.isLinux {
        oci = import ./nix/oci.nix {
          inherit pkgs;
          bscLabPackage = self.packages.${pkgs.stdenv.hostPlatform.system}.default;
        };
      });

      # A NixOS service module, so an operator can run an instance
      # declaratively. See nix/modules/bsc-lab.nix — it owns the two things the
      # hosting platform otherwise decides for us: ontology MIME types and the
      # cross-origin isolation headers that GitHub Pages cannot apply.
      nixosModules.default = import ./nix/modules/bsc-lab.nix;

      # `nix flake check` builds the package, so a broken build fails the same
      # gate as a broken evaluation. On Linux it additionally boots a clean
      # NixOS VM with the module enabled and asserts the deployment is correct —
      # routes, media types, headers, real 404s, no embedded credentials.
      # The VM test is Linux-only; on macOS the check set is just the package
      # and CI is the machine that boots the VM.
      checks = forAllSystems (pkgs:
        let system = pkgs.stdenv.hostPlatform.system;
        in
        {
          package = self.packages.${system}.default;
        }
        // pkgs.lib.optionalAttrs pkgs.stdenv.hostPlatform.isLinux {
          nixos-vm = import ./nix/tests/bsc-lab.nix {
            inherit pkgs;
            bscLabModule = self.nixosModules.default;
            bscLabPackage = self.packages.${system}.default;
            # One definition of a correct deployment, shared with the OCI image.
            smokeScript = ./scripts/smoke-http.sh;
          };
        });

      # `nix fmt` formats the Nix sources in this repo.
      formatter = forAllSystems (pkgs: pkgs.nixpkgs-fmt);
    };
}
