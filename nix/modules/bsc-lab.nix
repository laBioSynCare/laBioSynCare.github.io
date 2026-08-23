# NixOS service module: serve SSTIM Workbench from the reproducible package.
#
# The application is a static site, so this is deliberately nginx plus a root
# directory and nothing else — no application server, no database, no runtime
# secrets. An operator writes `services.bsc-lab.enable = true;` and gets a
# working instance built from the same derivation `nix build` produces.
#
# Two things this module owns that the hosting platform otherwise decides:
#
#   * Cross-origin isolation headers. static/_headers records the intended
#     COOP/COEP/CORP policy, but that file is Netlify syntax and GitHub Pages
#     ignores it — so on the public instance the policy is aspirational. Here it
#     is actually applied, which is what makes SharedArrayBuffer-dependent work
#     possible on a self-hosted deployment later.
#   * MIME types for the ontology. `.ttl` and `.jsonld` are absent from nginx's
#     default mime.types, so without this the knowledge graph would be served as
#     application/octet-stream and content negotiation would be a lie.

{ config, lib, pkgs, ... }:

let
  cfg = config.services.bsc-lab;

  # The deployment document, generated declaratively from `settings`. The
  # package itself stays untouched and identical across every deployment; this
  # file is the only thing that differs, and nginx serves it from the store
  # beside the site.
  runtimeConfigFile = pkgs.writeText "bsc-lab-runtime-config.json"
    (builtins.toJSON (
      { model = "bsc-lab-runtime-config-1"; }
      // (if cfg.settings == null then { } else cfg.settings)
    ));
in
{
  options.services.bsc-lab = {
    enable = lib.mkEnableOption "the SSTIM Workbench static sensory-stimulation environment";

    package = lib.mkOption {
      type = lib.types.package;
      description = "The SSTIM Workbench package; its compatibility path is share/bsc-lab.";
    };

    hostName = lib.mkOption {
      type = lib.types.str;
      default = "localhost";
      description = "Virtual host name to serve under.";
    };

    listenAddress = lib.mkOption {
      type = lib.types.str;
      default = "0.0.0.0";
      description = "Address nginx binds to.";
    };

    port = lib.mkOption {
      type = lib.types.port;
      default = 8080;
      description = "Port nginx listens on.";
    };

    openFirewall = lib.mkOption {
      type = lib.types.bool;
      default = false;
      description = "Open the configured port in the firewall.";
    };

    settings = lib.mkOption {
      type = lib.types.nullOr (lib.types.attrsOf lib.types.anything);
      default = null;
      example = lib.literalExpression ''
        {
          instance = { id = "https://lab.example.org/"; name = "Example Research Lab"; };
          identity.provider = "anonymous";
          storage.provider = "local";
        }
      '';
      description = ''
        Deployment configuration, served as `runtime-config.json` beside the
        application and read by it at startup.

        This is what makes one immutable package serve many operators: the
        package is bit-reproducible and identical for everyone, and everything
        that distinguishes this deployment lives here instead of in the build.
        Leave it null to run exactly as the package was built.

        `model` is supplied automatically. Invalid values do not break the
        instance — the application falls back to local-only operation and
        reports why.
      '';
    };
  };

  config = lib.mkIf cfg.enable {
    services.nginx = {
      enable = true;
      recommendedGzipSettings = true;
      recommendedOptimisation = true;

      virtualHosts.${cfg.hostName} = {
        listen = [{ addr = cfg.listenAddress; port = cfg.port; }];
        root = "${cfg.package}/share/bsc-lab";

        extraConfig = ''
          # Ontology media types. Absent from nginx's default mime.types, and
          # serving Turtle as octet-stream would break every RDF client.
          types {
            text/turtle                       ttl;
            application/ld+json               jsonld;
            application/rdf+xml               rdf owl;
            application/wasm                  wasm;
            application/manifest+json         webmanifest;
          }

          # Cross-origin isolation, mirroring static/_headers. GitHub Pages
          # cannot apply that file; a self-hosted instance can.
          add_header Cross-Origin-Opener-Policy   "same-origin" always;
          add_header Cross-Origin-Embedder-Policy "require-corp" always;
          add_header Cross-Origin-Resource-Policy "same-origin" always;

          # Prerendered routes are real directories with index.html. There is
          # deliberately no SPA fallback: an unknown path must 404 rather than
          # silently return the homepage, or every route assertion becomes
          # meaningless and crawlers index phantom pages.
          location / {
            try_files $uri $uri/ $uri/index.html =404;
          }
${lib.optionalString (cfg.settings != null) ''
            # Deployment configuration. Served from the store rather than the
            # package root, which is read-only and shared by every deployment.
            # Never cached: an operator who changes this expects the change to
            # take effect on the next load, not after a cache expires.
            location = /runtime-config.json {
              alias ${runtimeConfigFile};
              default_type application/json;
              add_header Cache-Control "no-store" always;

              # add_header does not inherit into a location that sets any of its
              # own, so the isolation policy is repeated rather than lost. CORP
              # in particular is load-bearing: under COEP the document cannot
              # fetch a same-origin subresource without it.
              add_header Cross-Origin-Opener-Policy   "same-origin" always;
              add_header Cross-Origin-Embedder-Policy "require-corp" always;
              add_header Cross-Origin-Resource-Policy "same-origin" always;
            }
          ''}
        '';
      };
    };

    networking.firewall.allowedTCPPorts = lib.mkIf cfg.openFirewall [ cfg.port ];
  };
}
