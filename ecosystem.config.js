module.exports = {
  apps: [
    {
      name: "aidt-backend",
      cwd: "/opt/ai-discover-tunisia/backend",
      script: "/opt/ai-discover-tunisia/backend/venv/bin/uvicorn",
      args: "app.main:app --host 0.0.0.0 --port 8000",
      interpreter: "/opt/ai-discover-tunisia/backend/venv/bin/python",
      autorestart: true,
      max_restarts: 10,
      restart_delay: 3000,
      env: {
        PYTHONUNBUFFERED: "1"
      }
    }
  ]
};
