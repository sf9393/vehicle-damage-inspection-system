# Vehicle Damage Inspection System

An open-source, AI-assisted web application for reviewing vehicle photos and identifying visible exterior damage. It is designed as a human-in-the-loop inspection aid for rental fleets, body shops, insurers, and vehicle operators.

**[View the live demo →](https://sf9393.github.io/vehicle-damage-inspection-system/)**

The initial model is a YOLOv8 segmentation model trained on the CarDD dataset. It can identify dents, scratches, cracks, shattered glass, broken lamps, and flat tires.

> **Important:** This application is an inspection assistant—not a certified repair estimate, claims decision system, or vehicle safety inspection. A qualified person must validate every result.

## Planned features

- Upload vehicle inspection photos from desktop or mobile
- Detect and annotate visible damage regions
- Review, accept, or dismiss individual AI findings
- Generate inspection summaries with transparent severity and cost-range guidance
- Export inspection data as JSON and printable reports
- Deploy the dashboard to GitHub Pages or Cloudflare Pages

## Architecture

```text
React + TypeScript static dashboard
      │
      ├── GitHub Pages / Cloudflare Pages
      │
      └── FastAPI inference service
                │
                └── Ultralytics YOLOv8 CarDD segmentation model
```

The dashboard is static and can be hosted on GitHub Pages or Cloudflare Pages. The YOLO model runs in a separately deployed Python inference API; this keeps the static hosting path simple while allowing the model to run on suitable CPU/GPU infrastructure.

## Technology stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS
- **API:** Python, FastAPI, Uvicorn
- **Computer vision:** Ultralytics YOLOv8 instance segmentation
- **Initial model:** [`abdullahg7/cardd-yolov8s`](https://huggingface.co/abdullahg7/cardd-yolov8s) v2.0 (MIT license)
- **Hosting:** GitHub Pages or Cloudflare Pages for the UI; a container host for inference

## Project status

MVP implementation in progress. See [prd.md](prd.md) for product requirements, architecture, API contract, deployment details, and known limitations.

## Run locally

### Prerequisites

- Node.js 22+ for the dashboard
- Python 3.11+ for the inference API

### 1. Start the model API

```bash
make run-api
```

The first real inspection downloads the public model weights. The API is then available at `http://localhost:8080`; use `http://localhost:8080/health` to verify it is running.

### 2. Start the dashboard

In a second terminal, configure the dashboard to use the local API and start it:

```bash
cp .env.example .env.local
# Set VITE_INFERENCE_API_URL=http://localhost:8080 in .env.local
npm ci
npm run dev
```

Open the local dashboard URL shown in the terminal, upload JPEG, PNG, or WebP vehicle photos, and run an inspection.

### Run checks

```bash
make test
```

This creates an isolated Python environment, runs API rule tests, and checks the API source for syntax errors. To install the complete YOLO model runtime before running the API, use `make install-api`.

## Deployment notes

### GitHub Pages

The included [GitHub Pages workflow](.github/workflows/pages.yml) builds and publishes the dashboard on pushes to `main`. In GitHub repository settings, set **Pages → Source** to **GitHub Actions**, then add an `INFERENCE_API_URL` Actions variable containing the public FastAPI service URL. Permit the final Pages domain in the API's `ALLOWED_ORIGINS` setting.

### Cloudflare Pages

Deploy the same `dist/` output and configure the API URL as a Cloudflare Pages environment variable. A Pages Function may optionally proxy requests to the inference API.

Neither static-hosting option is expected to run the Python YOLO model directly; the inference API is deployed independently.

## License

The application license will be selected before the first implementation release. The proposed initial model is distributed under the MIT license; verify all dependency and model licenses before production use.
