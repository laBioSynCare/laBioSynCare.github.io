# NixOS service module: serve BSC Lab from the reproducible package.
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
in
{
  options.services.bsc-lab = {
    enable = lib.mkEnableOption "the BSC Lab static sensory-stimulation workbench";

    package = lib.mkOption {
      type = lib.types.package;
      description = "The BSC Lab package; its site is served from share/bsc-lab.";
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
        '';
      };
    };

    networking.firewall.allowedTCPPorts = lib.mkIf cfg.openFirewall [ cfg.port ];
  };
}
