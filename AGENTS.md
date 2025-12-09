<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

# General Guidelines for working with Nx

- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- You have access to the Nx MCP server and its tools, use them to help the user
- When answering questions about the repository, use the `nx_workspace` tool first to gain an understanding of the workspace architecture where applicable.
- When working in individual projects, use the `nx_project_details` mcp tool to analyze and understand the specific project structure and dependencies
- For questions around nx configuration, best practices or if you're unsure, use the `nx_docs` tool to get relevant, up-to-date docs. Always use this instead of assuming things about nx configuration
- If the user needs help with an Nx configuration or project graph error, use the `nx_workspace` tool to get any errors

<!-- nx configuration end-->

<!-- MCP AI Capabilities Suite start -->

# MCP AI Capabilities Suite

You have at your disposal, the MCP ACS Debugger, MCP ACS Screenshot, MCP ACS Process, and soon, MCP ACS Filesystem tools which will allow you to debug code, take screenshots (to see what UI is doing, for documentation, bug reports and more) and to kill and manage processes (like stuck/hung code, etc). Make sure to consider these tools over adding debug prints, etc.

<!-- MCP AI Capabilitites Suite end -->
