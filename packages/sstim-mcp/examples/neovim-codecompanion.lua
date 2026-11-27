require("codecompanion").setup({
  mcp = {
    servers = {
      sstim = {
        cmd = { "npx", "--yes", "@sstim/mcp@0.3.1" },
      },
    },
    opts = {
      default_servers = { "sstim" },
    },
  },
})
