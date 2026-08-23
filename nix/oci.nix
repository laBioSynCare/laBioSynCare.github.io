# OCI image, built from the same derivation as `nix build`.
#
# For operators who do not run Nix. The application is not rebuilt here: the
# image packages the identical store path the NixOS module serves, so the three
# deployment paths — `nix build`, the NixOS service, and this container — cannot
# drift from one another.
#
# nginx configuration mirrors nix/modules/bsc-lab.nix deliberately: the same
# ontology media types, the same cross-origin isolation headers, and the same
# refusal to fall back to index.html on an unknown path. The shared
# scripts/smoke-http.sh asserts that both really do behave identically.

{ pkgs, bscLabPackage }:

let
  port = 8080;

  # A non-root user. Static file serving needs no privileges, and a container
  # that runs its web server as root because that was the default is a habit
  # worth not forming.
  uid = 1000;
  gid = 1000;

  nginxConf = pkgs.writeText "nginx.conf" ''
    daemon off;
    error_log /dev/stderr warn;
    pid /tmp/nginx.pid;
    events { worker_connections 1024; }

    http {
      include ${pkgs.nginx}/conf/mime.types;

      # Ontology media types, absent from nginx's defaults. Serving Turtle as
      # octet-stream would break every RDF client.
      types {
        text/turtle                 ttl;
        application/ld+json         jsonld;
        application/rdf+xml         rdf owl;
        application/wasm            wasm;
        application/manifest+json   webmanifest;
      }

      # Writable paths under /tmp so the image can run read-only and non-root.
      client_body_temp_path /tmp/client_body;
      proxy_temp_path       /tmp/proxy;
      fastcgi_temp_path     /tmp/fastcgi;
      uwsgi_temp_path       /tmp/uwsgi;
      scgi_temp_path        /tmp/scgi;

      access_log /dev/stdout;
      sendfile on;

      server {
        listen ${toString port};
        root ${bscLabPackage}/share/bsc-lab;

        add_header Cross-Origin-Opener-Policy   "same-origin" always;
        add_header Cross-Origin-Embedder-Policy "require-corp" always;
        add_header Cross-Origin-Resource-Policy "same-origin" always;

        # No SPA fallback: an unknown path must 404.
        location / {
          try_files $uri $uri/ $uri/index.html =404;
        }

        # Deployment configuration (gap G6). The package root is a read-only
        # store path shared by every deployment, so the operator's document is
        # taken from a mount instead:
        #
        #   docker run -v ./runtime-config.json:/config/runtime-config.json:ro
        #
        # With nothing mounted this 404s, which the application reads as
        # "unconfigured" and runs exactly as built. That is the intended
        # default, not a failure — so the location must not be conditional on
        # the file existing.
        location = /runtime-config.json {
          alias /config/runtime-config.json;
          default_type application/json;
          add_header Cache-Control "no-store" always;

          # add_header does not inherit into a location declaring its own, and
          # under COEP the document cannot fetch this without CORP.
          add_header Cross-Origin-Opener-Policy   "same-origin" always;
          add_header Cross-Origin-Embedder-Policy "require-corp" always;
          add_header Cross-Origin-Resource-Policy "same-origin" always;
        }
      }
    }
  '';
in
pkgs.dockerTools.buildLayeredImage {
  name = "bsc-lab";
  tag = "latest";

  # Fixed timestamp keeps the image metadata deterministic; dockerTools defaults
  # to the epoch for the same reason.
  created = "1970-01-01T00:00:00Z";

  contents = [
    pkgs.nginx
    pkgs.cacert
    # Shipped so an operator can run the same conformance assertions against a
    # running container that CI does.
    pkgs.bash
    pkgs.curl
    pkgs.gnugrep
    pkgs.coreutils
  ];

  # nginx needs its user to exist and its temp directories to be present.
  extraCommands = ''
    mkdir -p tmp var/log/nginx var/cache/nginx etc config
    chmod 1777 tmp
    echo "nginx:x:${toString uid}:${toString gid}:nginx:/tmp:/bin/false" > etc/passwd
    echo "nginx:x:${toString gid}:" > etc/group
  '';

  config = {
    Entrypoint = [ "${pkgs.nginx}/bin/nginx" "-c" "${nginxConf}" ];
    User = "${toString uid}:${toString gid}";
    ExposedPorts."${toString port}/tcp" = { };
    WorkingDir = "/tmp";
    Labels = {
      "org.opencontainers.image.title" = "SSTIM Workbench";
      "org.opencontainers.image.description" =
        "Static sensory-stimulation workbench and SSTIM knowledge browser";
      "org.opencontainers.image.source" =
        "https://github.com/w3c-cg/sstim";
      "org.opencontainers.image.licenses" = "Apache-2.0";
    };
  };
}
