# AWS MCP Server Setup Guide

Since you have `uv` installed, the easiest way to run AWS MCP servers is using `uvx` to fetch and run them directly from PyPI.

## Recommended Configuration

Add the following to your MCP client configuration file:

- **Claude Desktop:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Cursor:** `.cursor/mcp.json` or via the "MCP" tab in settings.

### Configuration Snippet

```json
{
  "mcpServers": {
    "aws-api": {
      "command": "uvx",
      "args": [
        "awslabs.aws-api-mcp-server@latest"
      ],
      "env": {
        "AWS_REGION": "us-east-1",
        "AWS_PROFILE": "default"
      }
    },
    "aws-documentation": {
      "command": "uvx",
      "args": [
        "awslabs.aws-documentation-mcp-server@latest"
      ],
      "env": {
        "AWS_DOCUMENTATION_PARTITION": "aws",
        "FASTMCP_LOG_LEVEL": "ERROR"
      }
    },
    "aws-iac": {
      "command": "uvx",
      "args": [
        "awslabs.aws-iac-mcp-server@latest"
      ],
      "env": {
        "AWS_PROFILE": "default",
        "FASTMCP_LOG_LEVEL": "ERROR"
      }
    }
  }
}
```

## Available Servers

You can add more servers from the [Official AWS MCP Repository](https://github.com/awslabs/mcp) using the same pattern:
`uvx awslabs.<server-name>@latest`

## Notes
- Ensure you have a valid AWS profile configured in `~/.aws/credentials`.
- Change `AWS_REGION` and `AWS_PROFILE` in the config above to match your local setup.
