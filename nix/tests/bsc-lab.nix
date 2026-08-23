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

  # A second, independently configured instance of the *same* package. This is
  # the runtime-configuration acceptance criterion (gap G6): one immutable
  # artifact must serve two operators who want different things, without either
  # of them rebuilding it.
  nodes.operator = { ... }: {
    imports = [ bscLabModule ];

    services.bsc-lab = {
      enable = true;
      package = bscLabPackage;
      port = 8080;
      settings = {
        instance = {
          id = "https://lab.example.org/";
          name = "Example Research Lab";
        };
        identity.provider = "anonymous";
        storage.provider = "local";
      };
    };

    virtualisation.memorySize = 1024;
  };

  testScript = ''
    import json

    start_all()

    for machine in (server, operator):
        machine.wait_for_unit("nginx.service")
        machine.wait_for_open_port(8080)

    with subtest("both deployments satisfy the shared conformance contract"):
        # The same script the OCI container is checked with, so every deployment
        # path is held to one definition of correct rather than several
        # hand-written approximations that drift.
        for machine in (server, operator):
            print(machine.succeed(
                "${pkgs.bash}/bin/bash ${smokeScript} http://localhost:8080"
            ))

    with subtest("no Firebase credential is present in the deployed artifact"):
        server.fail("grep -RE 'AIza[0-9A-Za-z_-]{20,}' ${bscLabPackage}/share/bsc-lab")

    with subtest("the deployment needs no source checkout or npm at runtime"):
        server.fail("command -v npm")

    with subtest("an unconfigured instance serves no runtime configuration"):
        # Absence is the normal case, and the application treats a 404 as
        # "nothing to apply" rather than as an error.
        code = server.succeed(
            "curl -s -o /dev/null -w '%{http_code}' http://localhost:8080/runtime-config.json"
        ).strip()
        assert code == "404", f"expected 404 from an unconfigured instance, got {code}"

    with subtest("a configured instance serves exactly what the operator declared"):
        body = operator.succeed("curl -sf http://localhost:8080/runtime-config.json")
        print(body)
        config = json.loads(body)
        assert config["model"] == "bsc-lab-runtime-config-1", config
        assert config["instance"]["name"] == "Example Research Lab", config
        assert config["instance"]["id"] == "https://lab.example.org/", config
        assert config["storage"]["provider"] == "local", config
        assert config["identity"]["provider"] == "anonymous", config

    with subtest("configuration is never cached, so a change takes effect at once"):
        headers = operator.succeed(
            "curl -sI http://localhost:8080/runtime-config.json"
        ).lower()
        assert "no-store" in headers, headers
        # Under COEP the document cannot fetch this without CORP, and add_header
        # does not inherit into a location that declares its own.
        assert "cross-origin-resource-policy: same-origin" in headers, headers

    with subtest("configuration changes nothing about the artifact itself"):
        # The whole point of G6: two differently configured instances, one
        # derivation. Compare what each machine actually serves — if any
        # operator choice had leaked into the build, these would diverge.
        served = [
            machine.succeed(
                "curl -sf http://localhost:8080/ | sha256sum | cut -d' ' -f1"
            ).strip()
            for machine in (server, operator)
        ]
        assert served[0] == served[1], f"instances serve different applications: {served}"

        builds = [
            json.loads(machine.succeed("curl -sf http://localhost:8080/build-info.json"))["commit"]
            for machine in (server, operator)
        ]
        assert builds[0] == builds[1], f"instances report different commits: {builds}"
  '';
}
