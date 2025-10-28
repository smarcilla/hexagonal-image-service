# 🧱 Hexagonal Image Service

A REST API built with **NestJS** and **TypeScript** that processes images and manages image-processing tasks.  
It follows **Hexagonal Architecture (Ports & Adapters)**, ensuring clear separation between domain logic, application use cases, and infrastructure components.

---

## 🚀 Overview

This project is part of a technical test to design a modular, well-structured Node.js API that:

1. Generates resized variants of an image (1024px and 800px width).
2. Allows querying the status and result of processing tasks.
3. Persists data in **MongoDB** and documents the API using **Swagger**.

---

## 🧩 Architecture

The system follows **Hexagonal (Clean) Architecture**, structured into three main layers:

```shell
src/
├── domain/ # Entities, domain models and core logic
├── application/ # Use cases and business workflows
└── infrastructure/ # Controllers, repositories, adapters, config, and persistence
```

- **Domain:** defines entities (`Task`, `ImageVariant`) and business rules.
- **Application:** implements use cases like `CreateTask` and `GetTask`.
- **Infrastructure:** handles frameworks (NestJS), persistence (MongoDB), and I/O (Sharp for image processing).

This design allows:

- Independent testing of business logic.
- Replacing infrastructure components without changing core logic.
- Easy maintenance and extensibility.

---

## 🧠 Key Design Decisions

| #   | Decision                              | Rationale                                                                                    |
| --- | ------------------------------------- | -------------------------------------------------------------------------------------------- |
| 1   | **Synchronous image processing**      | The test does not require async behavior. A synchronous approach is simpler and predictable. |
| 2   | **Local image storage**               | The specification defines output paths under `/output/...`; external storage is unnecessary. |
| 3   | **Hexagonal architecture (required)** | Enforced separation of concerns for maintainability and testability.                         |
| 4   | **MongoDB with embedded image data**  | Matches provided examples; aligns with NoSQL document-based modeling.                        |
| 5   | **Price stored as float**             | Consistent with examples (e.g., `25.5`).                                                     |
| 6   | **No authentication**                 | Not requested in the requirements.                                                           |
| 7   | **Basic validation**                  | Image size and MIME type configurable via environment variables.                             |

---

## ⚙️ Tech Stack

- **Node.js** + **TypeScript**
- **NestJS** (framework)
- **MongoDB** + **Mongoose**
- **Sharp** (image processing)
- **Swagger / OpenAPI** (API documentation)
- **Jest** (unit & integration testing)
- **ESLint / Prettier** (linting & formatting)

---

## 🧪 API Endpoints

### `POST /tasks`

Creates a new image-processing task.

**Request body:**

```json
{
  "source": "/input/sample.jpg"
}
```

**Response (example):**

```json
{
  "taskId": "65d4a54b89c5e342b2c2c5f6",
  "status": "pending",
  "price": 25.5
}
```

### `GET /tasks/:taskId`

Retrieves task details, including status, price, and generated image variants.

**Response (completed example):**

```json
{
  "taskId": "65d4a54b89c5e342b2c2c5f6",
  "status": "completed",
  "price": 25.5,
  "images": [
    { "resolution": "1024", "path": "/output/image1/1024/f322b730b287.jpg" },
    { "resolution": "800", "path": "/output/image1/800/202fd8b3174.jpg" }
  ]
}
```

## 🧰 Environment Variables

| Variable          | Default                                           | Description                  |
| ----------------- | ------------------------------------------------- | ---------------------------- |
| PORT              | 3000                                              | API listening port           |
| MONGO_URI         | mongodb://localhost:27017/hexagonal_image_service | Database connection string   |
| OUTPUT_DIR        | ./output                                          | Folder for processed images  |
| MAX_INPUT_SIZE_MB | 10                                                | Max allowed input image size |
| ALLOWED_MIME      | jpg,png,webp                                      | Accepted file formats        |

An .env.example file is provided for reference.

## 🧫 Testing

### Unit tests

Domain entities (_Task, ImageVariant_)

Use cases (_CreateTask, GetTask_)

### Integration tests

Full API flow (_POST → GET_)

Error cases (_invalid source, task not found, failed processing_)

**Run tests:**

```bash
npm run test
```

**Run with coverage:**

```bash
npm run test:cov
```

Target coverage: ≈100% (small codebase).

## 🧱 Project Setup

Local setup (no Docker)

### 1. Install dependencies

```bash
npm install
```

### 2. Start MongoDB locally (default port 27017)

### 3. Run the app

```bash
npm run start:dev
```

### Dockerized setup (optional)

```bash
docker-compose up --build
```

## 📚 Documentation

API documentation is auto-generated using Swagger and available at:

http://localhost:3000/api-docs
