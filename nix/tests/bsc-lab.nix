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

{ pkgs, bscLabModule, bscLabPackage }:

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

    with subtest("the application is served"):
        server.succeed("curl --fail --silent http://localhost:8080/ | grep -q 'BSC Lab'")

    with subtest("prerendered routes each return their own page"):
        for route in ["graph", "creator", "field", "sparql", "presets", "logbook", "settings", "about"]:
            server.succeed(f"curl --fail --silent http://localhost:8080/{route}/ >/dev/null")

    with subtest("ontology is published with the right media type"):
        server.succeed(
            "curl --fail --silent http://localhost:8080/ontology/sstim-core.ttl "
            "| grep -q '@prefix sstim:'"
        )
        server.succeed(
            "curl --silent --head http://localhost:8080/ontology/sstim-core.ttl "
            "| grep -qi 'content-type: text/turtle'"
        )
        server.succeed(
            "curl --silent --head http://localhost:8080/ontology/context.jsonld "
            "| grep -qi 'content-type: application/ld+json'"
        )

    with subtest("PWA assets are served with correct types"):
        server.succeed("curl --fail --silent http://localhost:8080/service-worker.js >/dev/null")
        server.succeed(
            "curl --silent --head http://localhost:8080/manifest.webmanifest "
            "| grep -qi 'content-type: application/manifest+json'"
        )

    with subtest("cross-origin isolation headers are applied"):
        headers = server.succeed("curl --silent --head http://localhost:8080/")
        assert "same-origin" in headers.lower(), "COOP missing"
        assert "require-corp" in headers.lower(), "COEP missing"

    with subtest("an unknown path is a real 404, not a soft homepage"):
        code = server.succeed(
            "curl --silent --output /dev/null --write-out '%{http_code}' "
            "http://localhost:8080/definitely-not-a-route.xyz"
        ).strip()
        assert code == "404", f"expected 404, got {code}"

    with subtest("no Firebase credential is present in the deployed artifact"):
        server.fail(
            "grep -RE 'AIza[0-9A-Za-z_-]{20,}' ${bscLabPackage}/share/bsc-lab"
        )

    with subtest("the deployment needs no source checkout or npm at runtime"):
        server.fail("command -v npm")
  '';
}
