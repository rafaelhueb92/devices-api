# Devices API

<div align="center">
  <img src="./images/device-logo.png" alt="Devices API Logo" width="300"/>
</div>

## 🏃 How to run

```bash
 docker compose up --build --force-recreate
```

#### Overview

This project is a **NestJS-based REST API** for managing devices, featuring endpoints for CRUD operations, filtering, and health checks. It uses MongoDB for persistence, Redis for caching, and includes Swagger documentation and basic authentication. The application is containerized using Docker Compose for easy local development and testing.

---

#### Features

- Device CRUD operations (`/devices`)
- Filter devices by brand or state
- Health check endpoint (`/health`)
- Basic authentication for device endpoints
- Rate limiting (throttling) for all endpoints
- Swagger API documentation at `/api`
- MongoDB and Redis integration
- Docker Compose setup for local development

---

#### Prerequisites

- [Docker](https://www.docker.com/get-started)
- [Docker Compose](https://docs.docker.com/compose/)
- [Node.js](https://nodejs.org/) (for local development outside Docker)

---

#### Getting Started

##### 1. **Clone the repository**

```bash
git clone <your-repo-url>
cd <your-repo-directory>
```

##### 2. **Configure Environment Variables**

Copy the example environment file and fill in your values:

```bash
cp .env.example .env
```

Edit `.env` as needed. Example:

```env
# MongoDB Configuration
MONGO_DB_URL=mongodb://root:example@mongo:27017
MONGO_DB_NAME=devices_db

# Application Credentials
APP_USER=admin
APP_PASSWORD=adminpass

# Redis Configuration
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_TTL=3600

# Application Configuration
PORT=3000
NODE_ENV=develop
```

> **Note:**
>
> - Use `mongo` and `redis` as hostnames for MongoDB and Redis when running inside Docker Compose.
> - The default MongoDB credentials are set in `docker-compose.yml` as `root`/`example`.

##### 3. **Build and Start the Application**

```bash
docker-compose up --build
```

- The API will be available at: [http://localhost:3000](http://localhost:3000)
- Swagger docs: [http://localhost:3000/api](http://localhost:3000/api)
- Mongo Express: [http://localhost:8081](http://localhost:8081)

##### 4. **API Authentication**

All `/devices` endpoints require **Basic Auth** using the credentials from your `.env` (`APP_USER`/`APP_PASSWORD`).

---

#### API Endpoints

- `POST /devices` – Create a new device
- `GET /devices` – List all devices
- `GET /devices/:id` – Get device by ID
- `PUT /devices/:id` – Update device completely
- `PATCH /devices/:id` – Update device partially
- `DELETE /devices/:id` – Delete device
- `GET /devices/brand/:brand` – List devices by brand
- `GET /devices/state/:state` – List devices by state
- `GET /health` – Health check (no authentication required)

---

#### Running Tests

**Unit and Integration Tests:**

```bash
npm install
npm run test
```

**End-to-End (e2e) Tests:**

1. Create a `.env.test` file (see below for CI/CD instructions).
2. Start test dependencies (MongoDB, Redis) as needed.
3. Run:

```bash
npm run test:e2e
```

---

#### CI/CD & Environment Variables

- **Never commit `.env` or `.env.test` with real secrets.**
- In CI/CD, generate `.env.test` dynamically using pipeline environment variables.
- Example for GitHub Actions:

```yaml
- name: Create .env.test
  run: |
    cat <<EOF > .env.test
    MONGO_DB_URL=${{ secrets.MONGO_DB_URL }}
    MONGO_DB_NAME=${{ secrets.MONGO_DB_NAME }}
    APP_USER=${{ secrets.APP_USER }}
    APP_PASSWORD=${{ secrets.APP_PASSWORD }}
    REDIS_HOST=${{ secrets.REDIS_HOST }}
    REDIS_PORT=${{ secrets.REDIS_PORT }}
    REDIS_PASSWORD=${{ secrets.REDIS_PASSWORD }}
    REDIS_TTL=3600
    PORT=3001
    NODE_ENV=test
    EOF
```

---

#### Useful Docker Commands

- **Rebuild and restart containers:**
  `docker-compose up --build`
- **Stop containers:**
  `docker-compose down`
- **View logs:**
  `docker-compose logs -f`

---

#### Troubleshooting

- If you get connection errors, ensure MongoDB and Redis are running and accessible.
- For local development, use `localhost` for MongoDB/Redis hosts; for Docker Compose, use service names (`mongo`, `redis`).
- If ports are in use, change them in `.env` and `docker-compose.yml`.

---

#### Future Improvements

- **Deploy to AWS using ECS + DynamoDB or inside an EKS Cluster**
- **Include an APM such as Datadog or Prometheus/Grafana**
- **Integrate Socket.io for a real-time dashboard of device status**
- **Enhance security with user roles and permissions**

---
