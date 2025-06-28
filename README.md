# AI Trace Datasets

A modern, full-stack application for managing, uploading, and analyzing AI trace and image datasets. Built for extensibility and ease of use, it supports collaborative workflows, robust authentication, and scalable data storage.

## Features
- Upload and manage image and trace datasets
- View and organize dataset metadata
- Integrate datasets into experiments and workflows
- Role-based authentication (supports Auth0 and standard modes)
- FastAPI backend with async PostgreSQL support
- React frontend (Vite, Bun, TypeScript, Tailwind CSS)
- Centralized API config and environment variable management
- Dockerized for local development and production

## Architecture
- **Frontend**: React + Vite (TypeScript), managed with Bun
- **Backend**: FastAPI (Python), managed with uv
- **Database**: PostgreSQL (Dockerized)
- **Proxy**: Nginx (Dockerized)
- **Containerization**: Multi-stage Docker build for full stack

## Getting Started

### Prerequisites
- [Bun](https://bun.sh/) (for frontend)
- [uv](https://github.com/astral-sh/uv) (for backend Python deps)
- [Docker](https://www.docker.com/) (for database and full stack)

### Quick Start (Development)

1. **Clone the repository:**
   ```sh
   git clone <YOUR_GIT_URL>
   cd ai-trace-datasets
   ```

2. **Configure environment variables:**
   - Copy `.env.dev.example` to `.env.dev` in the backend and adjust settings as needed.
   - Set up frontend environment variables (see `.env.example`).

3. **Start PostgreSQL with Docker:**
   ```sh
   docker-compose up -d postgres
   ```

4. **Install and run the backend:**
   ```sh
   cd backend
   uv pip install -r requirements.txt
   uvicorn ai_trace_datasets.main:app --reload
   ```

5. **Install and run the frontend:**
   ```sh
   cd frontend
   bun install
   bun run dev
   ```

6. **Access the app:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000/docs

### Full Stack with Docker Compose
To run the entire stack (frontend, backend, db, nginx):
```sh
docker-compose up --build
```

## Configuration
- **Frontend**: Uses `VITE_API_BASE_URL` to connect to backend API
- **Backend**: Configure DB and cloud credentials in `.env.dev`
- **Nginx**: Proxies frontend/backend, configurable via env vars

## Folder Structure
- `frontend/` — React app (Vite, Bun, TypeScript)
- `backend/` — FastAPI app (Python)
- `docker-compose.yml` — Multi-service orchestration
- `Dockerfile` — Multi-stage build for production
- `LICENSE` — MIT License

## License
This project is licensed under the MIT License. See [LICENSE](./LICENSE) for details.

## Contributing
Pull requests and issues are welcome! Please open an issue to discuss major changes first.

## Contact
For questions or support, please contact the maintainers or open an issue on GitHub.

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
