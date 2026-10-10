require("codecompanion").setup({
  mcp = {
    servers = {
      sstim = {
        cmd = { "node", "/absolute/path/to/sstim/packages/sstim-mcp/server.mjs" },
      },
    },
    opts = {
      default_servers = { "sstim" },
    },
  },
})
