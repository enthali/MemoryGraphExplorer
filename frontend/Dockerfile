# Dockerfile for Web Viewer Frontend (StreamableHTTP)
FROM python:3.12-slim

WORKDIR /app

# Upgrade system packages to address vulnerabilities
RUN apt-get update && apt-get upgrade -y && apt-get clean

# Copy and install Python dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy web viewer files
COPY frontend/web_viewer/ ./web_viewer/

# Set working directory to web_viewer
WORKDIR /app/web_viewer

# Expose port for Flask server
EXPOSE 8080

# Set environment variables
ENV FLASK_ENV=production
ENV PYTHONPATH=/app

# Run the Flask server with HTTP MCP client
# The MCP server URL will point to the mcp-server container
CMD ["python", "server.py", "--host", "0.0.0.0", "--port", "8080", "--mcp-url", "http://mcp-server:3001/mcp"]
