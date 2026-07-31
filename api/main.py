"""Inference API for Vantage vehicle-damage inspections."""

from __future__ import annotations

import io
import os
import uuid
from contextlib import asynccontextmanager
from typing import Annotated

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image, ImageOps
from pydantic import BaseModel

MODEL_REPO = os.getenv("MODEL_REPO", "abdullahg7/cardd-yolov8s")
MODEL_FILE = os.getenv("MODEL_FILE", "v2.0/best.pt")
MAX_IMAGE_BYTES = int(os.getenv("MAX_IMAGE_BYTES", str(12 * 1024 * 1024)))
ALLOWED_ORIGINS = [value.strip() for value in os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",") if value.strip()]
model = None

@asynccontextmanager
async def lifespan(_: FastAPI):
    yield

app = FastAPI(title="Vantage inference API", version="0.1.0", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=ALLOWED_ORIGINS, allow_credentials=False, allow_methods=["POST", "GET"], allow_headers=["Content-Type"])

class BoundingBox(BaseModel):
    x: float
    y: float
    width: float
    height: float

class Detection(BaseModel):
    id: str
    label: str
    confidence: float
    bbox: BoundingBox
    polygon: list[list[float]] | None = None
    severity: str

class ImageResult(BaseModel):
    image_id: str
    width: int
    height: int
    detections: list[Detection]

class AnalysisResponse(BaseModel):
    model: dict[str, str]
    results: list[ImageResult]

def get_model():
    global model
    if model is not None:
        return model
    try:
        from huggingface_hub import hf_hub_download
        from ultralytics import YOLO
        weights = hf_hub_download(repo_id=MODEL_REPO, filename=MODEL_FILE)
        model = YOLO(weights)
        return model
    except Exception as exc:
        raise HTTPException(status_code=503, detail="The damage model is warming up or unavailable. Retry shortly.") from exc

def severity_for(label: str, box: BoundingBox, width: int, height: int) -> str:
    if label in {"glass_shatter", "lamp_broken", "tire_flat"}:
        return "safety_review"
    coverage = (box.width * box.height) / max(width * height, 1)
    if coverage > 0.08 or label == "crack":
        return "major"
    return "moderate" if coverage > 0.02 else "minor"

@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "model": "loaded" if model else "lazy"}

@app.post("/v1/inspections/analyze", response_model=AnalysisResponse)
async def analyze(images: Annotated[list[UploadFile], File(description="One to twelve inspection images")]) -> AnalysisResponse:
    if not 1 <= len(images) <= 12:
        raise HTTPException(status_code=422, detail="Upload between 1 and 12 images.")
    detector = get_model()
    results: list[ImageResult] = []
    for image_file in images:
        if image_file.content_type not in {"image/jpeg", "image/png", "image/webp"}:
            raise HTTPException(status_code=415, detail=f"Unsupported image type: {image_file.content_type}")
        payload = await image_file.read()
        if len(payload) > MAX_IMAGE_BYTES:
            raise HTTPException(status_code=413, detail=f"{image_file.filename} exceeds the image size limit.")
        try:
            image = ImageOps.exif_transpose(Image.open(io.BytesIO(payload))).convert("RGB")
        except Exception as exc:
            raise HTTPException(status_code=422, detail=f"Could not read {image_file.filename} as an image.") from exc
        width, height = image.size
        prediction = detector.predict(image, conf=0.35, verbose=False)[0]
        detections: list[Detection] = []
        masks = prediction.masks.xy if prediction.masks is not None else []
        for index, box in enumerate(prediction.boxes):
            x1, y1, x2, y2 = [float(value) for value in box.xyxy[0].tolist()]
            bbox = BoundingBox(x=x1, y=y1, width=x2-x1, height=y2-y1)
            label = str(prediction.names[int(box.cls[0])])
            polygon = masks[index].tolist() if index < len(masks) else None
            detections.append(Detection(id=f"det_{uuid.uuid4().hex[:10]}", label=label, confidence=round(float(box.conf[0]), 4), bbox=bbox, polygon=polygon, severity=severity_for(label, bbox, width, height)))
        results.append(ImageResult(image_id=image_file.filename or "image", width=width, height=height, detections=detections))
    return AnalysisResponse(model={"name": "cardd-yolov8s", "version": "2.0"}, results=results)
