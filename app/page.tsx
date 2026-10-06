"use client";

import { ChangeEvent, DragEvent, useRef, useState } from "react";

type Photo = { id: string; name: string; url: string; file: File; state: "ready" | "analyzing" | "done" | "error" };

const findings = [
  { label: "Scratch", detail: "Front-left door", confidence: "91%", tone: "amber" },
  { label: "Dent", detail: "Rear quarter panel", confidence: "84%", tone: "coral" },
  { label: "Lamp broken", detail: "Right tail lamp", confidence: "96%", tone: "violet" },
];
const publicPath = "/vehicle-damage-inspection-system";

export default function Home() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [dragging, setDragging] = useState(false);
  const [inspecting, setInspecting] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  function addFiles(files: FileList | File[]) {
    const valid = Array.from(files).filter((file) => file.type.startsWith("image/")).slice(0, 12 - photos.length);
    setPhotos((current) => [...current, ...valid.map((file) => ({
      id: `${file.name}-${file.lastModified}`,
      name: file.name,
      url: URL.createObjectURL(file), file,
      state: "ready",
    }))]);
  }

  function onFiles(event: ChangeEvent<HTMLInputElement>) {
    if (event.target.files) addFiles(event.target.files);
  }

  async function addTestImage() {
    const response = await fetch(`${publicPath}/test-inspection-sample.jpg`);
    const blob = await response.blob();
    addFiles([new File([blob], "cardd-validation-sample.jpg", { type: "image/jpeg" })]);
  }

  function drop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    addFiles(event.dataTransfer.files);
  }

  async function inspect() {
    if (!photos.length) return;
    setInspecting(true);
    setPhotos((current) => current.map((photo) => ({ ...photo, state: "analyzing" })));
    const apiUrl = process.env.NEXT_PUBLIC_INFERENCE_API_URL || process.env.VITE_INFERENCE_API_URL;
    if (!apiUrl) {
      setPhotos((current) => current.map((photo) => ({ ...photo, state: "error" })));
      setInspecting(false);
      return;
    }
    try {
      const formData = new FormData();
      photos.forEach((photo) => formData.append("images", photo.file));
      const response = await fetch(`${apiUrl.replace(/\/$/, "")}/v1/inspections/analyze`, { method: "POST", body: formData });
      if (!response.ok) throw new Error("Inspection request failed");
      setPhotos((current) => current.map((photo) => ({ ...photo, state: "done" })));
    } catch {
      setPhotos((current) => current.map((photo) => ({ ...photo, state: "error" })));
    } finally {
      setInspecting(false);
    }
  }

  return (
    <main>
      <header className="topbar">
        <a className="brand" href="#top"><span className="brand-mark">V</span> Vantage</a>
        <nav aria-label="Primary navigation"><a href="#inspection">Inspection</a><a href="#report">Reports</a><a href="#how-it-works">How it works</a></nav>
        <button className="avatar" aria-label="Open account menu">JA</button>
      </header>

      <section className="hero" id="top">
        <div className="eyebrow"><span /> AI-powered visual inspection</div>
        <h1>Inspect with confidence.<br /><em>Move faster.</em></h1>
        <p>Turn walkaround photos into an organized, human-reviewable damage report in minutes.</p>
        <div className="hero-meta"><span>YOLOv8 SEGMENTATION</span><i /> <span>HUMAN REVIEW REQUIRED</span></div>
      </section>

      <section className="workspace" id="inspection">
        <div className="section-heading"><div><span className="step">01 / NEW INSPECTION</span><h2>Upload your walkaround</h2></div><p>For best results, take one clear photo per panel in even lighting.</p></div>
        <div
          className={`dropzone ${dragging ? "dragging" : ""}`}
          onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={drop}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => event.key === "Enter" && input.current?.click()}
          onClick={() => input.current?.click()}
        >
          <input ref={input} onChange={onFiles} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden />
          <div className="upload-icon">↑</div>
          <strong>Drop vehicle photos here</strong>
          <span>or browse files · JPG, PNG, WebP · up to 12 images</span>
          <button className="outline" type="button">Select photos</button>
        </div>
        <div className="test-strip"><div><span className="step">MODEL VALIDATION SAMPLE</span><strong>Want to test the flow first?</strong><p>This included CarDD model-validation image is available for upload and review.</p></div><div><button className="text-button" onClick={addTestImage}>Add test image +</button><a href={`${publicPath}/test-inspection-sample.jpg`} download>Download JPG ↓</a></div></div>

        {photos.length > 0 && <div className="photo-queue">
          {photos.map((photo) => <article className="photo-card" key={photo.id}>
            <img src={photo.url} alt={`Uploaded ${photo.name}`} />
            <div><strong>{photo.name}</strong><span className={`status ${photo.state}`}>{photo.state === "done" ? "Analysis ready" : photo.state === "analyzing" ? "Analyzing…" : photo.state === "error" ? "Service unavailable — retry" : "Ready to inspect"}</span></div>
            <button onClick={() => setPhotos((current) => current.filter((item) => item.id !== photo.id))} aria-label={`Remove ${photo.name}`}>×</button>
          </article>)}
        </div>}

        <div className="action-row"><span>{photos.length ? `${photos.length} photo${photos.length > 1 ? "s" : ""} queued` : "Add 1–12 photos to begin"}</span><button className="primary" onClick={inspect} disabled={!photos.length || inspecting}>{inspecting ? "Analyzing photos…" : "Run inspection →"}</button></div>
      </section>

      <section className="capture-guide" id="how-it-works"><div className="section-heading"><div><span className="step">PHOTO CAPTURE GUIDE</span><h2>Set the model up for success</h2></div><p>Clear, consistent photos make visible damage easier to review.</p></div><div className="guide-grid"><article><span>01</span><h3>Walk the perimeter</h3><p>Photograph each corner, side, front, and rear. Keep panels fully in frame.</p></article><article><span>02</span><h3>Move closer</h3><p>Add a close-up for every suspected mark, dent, crack, lamp, or tire issue.</p></article><article><span>03</span><h3>Use even light</h3><p>Prefer daylight or bright shade. Avoid glare, heavy shadow, and wet surfaces.</p></article><article><span>04</span><h3>Keep it sharp</h3><p>Hold steady, clean the lens, and retake blurred images before inspection.</p></article></div></section>

      <section className="report" id="report">
        <div className="section-heading"><div><span className="step">02 / REVIEW REPORT</span><h2>Findings, made legible</h2></div><p>Example review state. AI findings must be accepted or dismissed by an inspector.</p></div>
        <div className="report-grid">
          <div className="preview-panel"><div className="car-stage"><div className="car-shape">VEHICLE<br />IMAGE</div><span className="hotspot h1">01</span><span className="hotspot h2">02</span><span className="hotspot h3">03</span></div><div className="legend"><span><b className="amber" /> Cosmetic</span><span><b className="coral" /> Repair</span><span><b className="violet" /> Safety review</span></div></div>
          <div className="findings"><div className="finding-header"><span>3 visible findings</span><strong>Review status <b>Pending</b></strong></div>{findings.map((finding, index) => <article className="finding" key={finding.label}><span className={`index ${finding.tone}`}>0{index + 1}</span><div><strong>{finding.label}</strong><p>{finding.detail}</p></div><span className="confidence">{finding.confidence}<small>confidence</small></span><button aria-label={`Review ${finding.label}`}>→</button></article>)}<div className="notice">Estimates are indicative. Validate all findings before repair or claims decisions.</div></div>
        </div>
      </section>

      <section className="how" id="how-it-works"><span className="step">03 / THE WORKFLOW</span><div className="flow"><article><b>01</b><h3>Capture</h3><p>Take clear, overlapping photos around the vehicle.</p></article><article><b>02</b><h3>Analyze</h3><p>Open-source computer vision identifies visible damage.</p></article><article><b>03</b><h3>Decide</h3><p>Review findings, then export a documented report.</p></article></div></section>

      <footer><span>VANTAGE / VEHICLE INSPECTION</span><span>Human review is required for every report.</span></footer>
    </main>
  );
}
