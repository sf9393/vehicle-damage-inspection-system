# Vehicle Damage Inspection System

An open-source, AI-assisted web application for reviewing vehicle photos and identifying visible exterior damage. It is designed as a human-in-the-loop inspection aid for rental fleets, body shops, insurers, and vehicle operators.

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

Planning phase. See [prd.md](prd.md) for product requirements, architecture, API contract, deployment details, and known limitations.

## Deployment notes

### GitHub Pages

Build and publish the frontend's static `dist/` directory using GitHub Actions. Configure the API URL as a build variable and permit the Pages domain in the API's CORS configuration.

### Cloudflare Pages

Deploy the same `dist/` output and configure the API URL as a Cloudflare Pages environment variable. A Pages Function may optionally proxy requests to the inference API.

Neither static-hosting option is expected to run the Python YOLO model directly; the inference API is deployed independently.

## License

The application license will be selected before the first implementation release. The proposed initial model is distributed under the MIT license; verify all dependency and model licenses before production use.
