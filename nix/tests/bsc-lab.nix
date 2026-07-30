# NixOS VM test: deploy the reproducible package into a clean machine and prove
# the deployment works, not merely that the module evaluates.
#
# This is the difference between "we wrote a NixOS module" and "an operator who
# enables this gets a correct instance". Every assertion below corresponds to a
# way a static deployment is commonly wrong: missing MIME types, an SPA fallback
# that turns 404s into soft-200s, absent isolation headers, or credentials baked
# into the artifact.
#
# Runs on Linux. `nix flake check` skips it on macOS, where CI is the machine
# that actually boots the VM.

{ pkgs, bscLabModule, bscLabPackage, smokeScript }:

pkgs.testers.runNixOSTest {
  name = "bsc-lab-deployment";

  nodes.server = { ... }: {
    imports = [ bscLabModule ];

    services.bsc-lab = {
      enable = true;
      package = bscLabPackage;
      port = 8080;
    };

    virtualisation.memorySize = 1024;
  };

  testScript = ''
    start_all()

    server.wait_for_unit("nginx.service")
    server.wait_for_open_port(8080)

    with subtest("the deployment satisfies the shared conformance contract"):
        # The same script the OCI container is checked with, so the two
        # deployment paths are held to one definition of correct rather than
        # two hand-written approximations that drift.
        print(server.succeed(
            "${pkgs.bash}/bin/bash ${smokeScript} http://localhost:8080"
        ))

    with subtest("no Firebase credential is present in the deployed artifact"):
        server.fail("grep -RE 'AIza[0-9A-Za-z_-]{20,}' ${bscLabPackage}/share/bsc-lab")

    with subtest("the deployment needs no source checkout or npm at runtime"):
        server.fail("command -v npm")
  '';
}
