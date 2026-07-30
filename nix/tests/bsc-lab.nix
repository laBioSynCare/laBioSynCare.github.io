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

    # Fetch to a file before asserting on content. `curl ... | grep -q` looks
    # natural but is a trap here: grep exits on first match, closing the pipe,
    # and the test driver runs with pipefail, so curl's write error (exit 23)
    # fails the assertion even though the content was found.
    def fetch(path, dest="/tmp/body"):
        server.succeed(f"curl --fail --silent http://localhost:8080{path} -o {dest}")
        return dest

    def headers(path, dest="/tmp/headers"):
        server.succeed(f"curl --silent --head http://localhost:8080{path} -o {dest}")
        return server.succeed(f"cat {dest}").lower()

    with subtest("the application is served"):
        fetch("/")
        server.succeed("grep -c 'BSC Lab' /tmp/body")

    with subtest("prerendered routes each return their own page"):
        for route in ["graph", "creator", "field", "sparql", "presets", "logbook", "settings", "about"]:
            fetch(f"/{route}/", f"/tmp/{route}")

    with subtest("ontology is published with the right media type"):
        fetch("/ontology/sstim-core.ttl", "/tmp/core.ttl")
        server.succeed("grep -c '@prefix sstim:' /tmp/core.ttl")
        assert "text/turtle" in headers("/ontology/sstim-core.ttl"), "Turtle content-type missing"
        assert "application/ld+json" in headers("/ontology/context.jsonld"), "JSON-LD content-type missing"

    with subtest("PWA assets are served with correct types"):
        fetch("/service-worker.js", "/tmp/sw.js")
        assert "application/manifest+json" in headers("/manifest.webmanifest"), "manifest content-type missing"

    with subtest("cross-origin isolation headers are applied"):
        root = headers("/")
        assert "cross-origin-opener-policy: same-origin" in root, "COOP missing"
        assert "cross-origin-embedder-policy: require-corp" in root, "COEP missing"
        assert "cross-origin-resource-policy: same-origin" in root, "CORP missing"

    with subtest("an unknown path is a real 404, not a soft homepage"):
        code = server.succeed(
            "curl --silent --output /dev/null --write-out '%{http_code}' "
            "http://localhost:8080/definitely-not-a-route.xyz"
        ).strip()
        assert code == "404", f"expected 404, got {code}"

    with subtest("no Firebase credential is present in the deployed artifact"):
        server.fail("grep -RE 'AIza[0-9A-Za-z_-]{20,}' ${bscLabPackage}/share/bsc-lab")

    with subtest("the deployment needs no source checkout or npm at runtime"):
        server.fail("command -v npm")
  '';
}
