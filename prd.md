# Vehicle Damage Inspection System — Product Requirements Document

## 1. Product summary

Build a web-based vehicle inspection system that analyzes photos of a vehicle and produces a clear, reviewable damage report. The system will use an open-source YOLOv8 instance-segmentation model trained on the CarDD dataset to identify six visible damage categories:

- Dent
- Scratch
- Crack
- Glass shatter
- Broken lamp
- Flat tire

The product is designed for rental agencies, fleet operators, body shops, and insurers as a first-pass inspection aid. It is not a final appraisal or safety decision tool; every result must be reviewable by a human.

## 2. Goals

- Let an inspector upload one or more vehicle photos from a desktop or mobile browser.
- Detect visible damage, draw masks/bounding regions, and present confidence scores.
- Aggregate detections into a single inspection report with severity and estimated repair-cost ranges.
- Preserve the original images and make an exportable report available to the inspector.
- Support a static web deployment on GitHub Pages or Cloudflare Pages.
- Use an open-source model and keep model selection/configuration replaceable.

## 3. Non-goals (initial release)

- Replacing certified repair estimates, claims decisions, or safety inspections.
- Determining mechanical/internal damage that is not visible in photos.
- Identifying a vehicle VIN, owner, or license plate.
- Live video processing, multi-user access control, or billing workflows.
- Training or fine-tuning a model in the first release.

## 4. Users and primary flow

**Inspector**

1. Opens a new inspection.
2. Adds vehicle details (optional) and uploads 1–12 photos.
3. Submits the photos for analysis.
4. Reviews each annotated image and can dismiss a false positive.
5. Reviews the report summary, exports PDF/JSON, or saves it.

## 5. Functional requirements

### Inspection workspace

- Drag-and-drop and mobile-camera image upload.
- JPEG, PNG, and WebP support; client-side validation and image-size guidance.
- Thumbnail queue, photo count, progress state, retry state, and deletion before submission.
- Optional metadata: inspection ID, vehicle make/model/year, odometer, and notes.

### AI analysis

- Send each source image to an inference API.
- Return a model version, elapsed inference time, and a structured list of detections.
- Each detection includes: damage class, confidence, bounding box, optional segmentation polygon/mask, source image ID, and model-generated severity.
- Render the returned regions over each source image.
- Allow inspectors to mark a detection as accepted or dismissed; user edits remain separate from model output.

### Report

- Aggregate accepted detections by damage class and image.
- Calculate a transparent severity band and indicative repair-cost range using configurable rules.
- Show a clear disclaimer that estimates require human validation.
- Export the inspection as JSON and print/save a browser-generated PDF report.

### Operational behavior

- If inference is unavailable, uploads and report drafts remain in browser storage and the UI explains how to retry.
- No images are sent to third parties except the configured inference service.
- The application must work as a static site with API URL set at build/deploy time.

## 6. Technical architecture

```text
Browser (React + TypeScript SPA)
   │  hosted as static files
   ├──────── GitHub Pages or Cloudflare Pages
   │
   ├── direct HTTPS requests ──► Inference API (FastAPI + Ultralytics)
   │                                  │
   │                                  ├── YOLOv8 CarDD segmentation weights
   │                                  └── optional object storage for uploaded images
   │
   └── browser IndexedDB ──► inspection drafts / user review state
```

### Frontend

- **Framework:** React 19 + TypeScript + Vite.
- **UI:** Tailwind CSS, accessible native controls, and SVG/canvas overlays for detection masks.
- **State/data:** TanStack Query for API requests; IndexedDB for unsent drafts and review state.
- **Reporting:** Client-side print stylesheet and JSON download. PDF is created from the browser print flow—no backend required.
- **Configuration:** `VITE_INFERENCE_API_URL` environment variable. An empty value enables demo/offline messaging but never fabricates inspection results.

### Inference API

- **Runtime:** Python 3.11+, FastAPI, Uvicorn.
- **Model runtime:** Ultralytics YOLOv8; default weights `abdullahg7/cardd-yolov8s` v2.0 from Hugging Face (MIT licensed).
- **Endpoint:** `POST /v1/inspections/analyze` using multipart images; returns normalized JSON detections and image dimensions.
- **Processing:** validate content type and size; correct EXIF orientation; run segmentation; serialize masks/polygons; discard temporary uploads after response by default.
- **Security:** request-size cap, rate limiting at the host/CDN, strict CORS allow-list, and no public write storage.
- **Deployment:** containerized API deployable to Cloudflare Workers AI only if the model is converted/supported; otherwise Cloud Run, Fly.io, Render, Railway, Modal, or another container host. GPU is optional for the small model but recommended for scale.

### Optional persistence (post-MVP)

- Cloudflare R2/S3-compatible object storage for encrypted image retention.
- Postgres/D1 for inspection metadata and audit events.
- Authentication via Cloudflare Access, Auth.js, or an organization identity provider.

## 7. Deployment requirements

### GitHub Pages

- Deploy only the Vite frontend as static assets via GitHub Actions.
- Configure `base` to the repository name for project pages.
- Store the inference URL as a GitHub Actions variable, then inject it during the build.
- The inference API is hosted separately and must permit the Pages origin with CORS.

### Cloudflare Pages

- Deploy the same frontend build output (`dist/`).
- Configure `VITE_INFERENCE_API_URL` in Pages environment variables.
- Optionally use a Pages Function as a same-origin proxy to the inference API, provided it only passes authorized/size-limited requests.
- Cloudflare Pages is sufficient for the dashboard; it is not assumed to run the Python/YOLO model directly.

## 8. API contract (MVP)

### `POST /v1/inspections/analyze`

**Request:** multipart/form-data

- `images`: one or more image files
- `inspection_id`: optional client identifier

**Response:**

```json
{
  "model": { "name": "cardd-yolov8s", "version": "2.0" },
  "results": [
    {
      "image_id": "front-left.jpg",
      "width": 1920,
      "height": 1080,
      "detections": [
        {
          "id": "det_01",
          "label": "scratch",
          "confidence": 0.87,
          "bbox": { "x": 442, "y": 318, "width": 284, "height": 62 },
          "polygon": [[442, 320], [727, 322], [725, 375], [444, 380]],
          "severity": "moderate"
        }
      ]
    }
  ]
}
```

## 9. Severity and estimate policy

- The AI model’s confidence represents detection likelihood, not repair severity or cost certainty.
- The MVP severity rule combines damage type and normalized damaged area; all thresholds live in a versioned configuration file.
- Cost ranges are indicative configuration values, shown as ranges and never as a final quote.
- Broken glass, broken lamps, and flat tires are tagged **safety review required**.
- The report visibly states that a qualified person must validate all findings before action is taken.

## 10. Quality, privacy, and accessibility

- Responsive at 320px+ and keyboard-operable.
- Color is never the only means of conveying severity; overlays include labels and patterns/contrast.
- Process only inspection images. Do not intentionally collect VINs, faces, license plates, or precise location data.
- Default data retention is zero on the API. Browser drafts are controlled by the inspector and can be cleared.
- Log operational metrics without raw image content.

## 11. Success metrics

- 95% of successful uploads receive a result in under 10 seconds for one 12MP image on the selected production host.
- 90% of internal test inspections are completed without manual technical support.
- Measure inspector acceptance/dismissal rate by class to target future model validation and fine-tuning.
- No inspection result is presented without a human-review disclaimer.

## 12. Delivery phases

1. **MVP:** static frontend, upload/review flow, FastAPI inference endpoint, model integration, annotations, report export, GitHub Pages and Cloudflare Pages deployment guides.
2. **Pilot hardening:** image retention policy, authenticated workspaces, audit history, configurable estimate rules, monitoring, and a validation set from the intended operating environment.
3. **Production intelligence:** model fine-tuning, active-learning review queue, vehicle-part detection, calibrated cost model, and regional compliance review.

## 13. Risks and decisions to confirm

- Public pretrained model performance varies with lighting, camera angle, vehicle type, paint color, and regional repair conventions; a representative validation set is required before operational reliance.
- Segmentation masks may be useful to reviewers but are not a measurement of physical area without camera calibration.
- GitHub Pages and Cloudflare Pages can host the frontend, but model inference needs its own supported compute service unless a compatible edge-model deployment is chosen.
- Confirm whether images may leave the browser, the intended retention period, and whether reports must be stored centrally before adding persistence/authentication.

## 14. Approval checkpoint

Implementation begins after approval of this PRD, especially the separate static-frontend/inference-API deployment model and the decision to use the MIT-licensed CarDD YOLOv8 segmentation weights as the initial model.
