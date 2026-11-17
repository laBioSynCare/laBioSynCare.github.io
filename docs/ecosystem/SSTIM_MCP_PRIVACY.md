# SSTIM remote MCP privacy notice

Updated 17 November 2026. Applies only to the public read-only SSTIM MCP endpoint operated using Netlify, not to other SSTIM Workbench features or external AI clients.

The MCP adapter accepts requests to browse **public** SSTIM ontology releases, search terms, retrieve individual concepts and generate a voluntary contribution-page link. No SSTIM login, personal profile or user identifier is needed.

The function receives network request metadata (such as IP address and user agent) and the MCP tool inputs you choose to provide. It uses tool input to fetch public records from the SSTIM Concept Reference API hosted on GitHub Pages. The adapter does not implement a user database, store conversations, or submit GitHub issues. Hosting providers may collect or retain operational logs according to their policies. OpenAI or other MCP clients process data under their own terms and privacy notices.

Do not send confidential research data, medical records, authentication tokens or other personal data in tool arguments. Source records and contribution-page URLs are public. If the operator later introduces authenticated or write-enabled tools, this notice and deployment must be revised before release.

For questions or requests regarding this endpoint, open a non-sensitive issue in the [SSTIM repository](https://github.com/w3c-cg/sstim/issues). Do not publish sensitive information in a public issue.
