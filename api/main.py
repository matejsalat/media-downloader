import json
import os
import subprocess
import time
from collections import defaultdict
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="MediaGrab API")

allowed_origins = os.environ.get("ALLOWED_ORIGINS", "http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_methods=["POST"],
    allow_headers=["Content-Type"],
)

# Simple in-memory rate limiting
_rate_limit: dict[str, list[float]] = defaultdict(list)
RATE_LIMIT_MAX = 10
RATE_LIMIT_WINDOW = 60  # seconds


class ExtractRequest(BaseModel):
    url: str


def _check_rate_limit(ip: str) -> bool:
    now = time.time()
    window_start = now - RATE_LIMIT_WINDOW
    _rate_limit[ip] = [t for t in _rate_limit[ip] if t > window_start]
    if len(_rate_limit[ip]) >= RATE_LIMIT_MAX:
        return False
    _rate_limit[ip].append(now)
    return True


@app.post("/extract")
async def extract(request: ExtractRequest):
    url = request.url.strip()
    if not url:
        raise HTTPException(status_code=400, detail="URL is required")

    try:
        result = subprocess.run(
            [
                "yt-dlp",
                "--dump-json",
                "--no-download",
                "--no-warnings",
                "--no-playlist",
                url,
            ],
            capture_output=True,
            text=True,
            timeout=25,
        )
    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=504, detail="Extraction timed out")
    except FileNotFoundError:
        raise HTTPException(
            status_code=500, detail="yt-dlp is not installed on the server"
        )

    if result.returncode != 0:
        stderr = result.stderr.strip()
        detail = "Could not extract media from this URL"
        if "Unsupported URL" in stderr:
            detail = "This URL is not supported"
        elif "Video unavailable" in stderr or "not available" in stderr.lower():
            detail = "This media is unavailable or private"
        raise HTTPException(status_code=422, detail=detail)

    try:
        info = json.loads(result.stdout)
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Failed to parse extraction result")

    formats = []
    seen = set()

    for f in info.get("formats", []):
        f_url = f.get("url")
        if not f_url:
            continue

        vcodec = f.get("vcodec", "none")
        acodec = f.get("acodec", "none")
        has_video = vcodec != "none"
        has_audio = acodec != "none"

        if has_video and has_audio:
            fmt_type = "video"
            height = f.get("height")
            quality = f"{height}p" if height else f.get("format_note", "unknown")
        elif has_video:
            # Video-only, skip (need merged)
            continue
        elif has_audio:
            fmt_type = "audio"
            abr = f.get("abr")
            quality = f"{int(abr)}kbps" if abr else f.get("format_note", "audio")
        else:
            continue

        ext = f.get("ext", "mp4")
        key = f"{fmt_type}-{quality}-{ext}"
        if key in seen:
            continue
        seen.add(key)

        formats.append(
            {
                "format_id": f.get("format_id", ""),
                "ext": ext,
                "quality": quality,
                "filesize": f.get("filesize") or f.get("filesize_approx"),
                "type": fmt_type,
                "url": f_url,
            }
        )

    # Sort: video by height desc, audio by abr desc
    def sort_key(fmt: dict) -> tuple:
        if fmt["type"] == "video":
            try:
                return (0, -int(fmt["quality"].replace("p", "")))
            except ValueError:
                return (0, 0)
        else:
            try:
                return (1, -int(fmt["quality"].replace("kbps", "")))
            except ValueError:
                return (1, 0)

    formats.sort(key=sort_key)

    # If no combined video+audio formats, include best video-only + best audio
    if not any(f["type"] == "video" for f in formats):
        for f in info.get("formats", []):
            f_url = f.get("url")
            if not f_url:
                continue
            vcodec = f.get("vcodec", "none")
            acodec = f.get("acodec", "none")
            if vcodec != "none" and acodec == "none":
                height = f.get("height")
                formats.insert(
                    0,
                    {
                        "format_id": f.get("format_id", ""),
                        "ext": f.get("ext", "mp4"),
                        "quality": f"{height}p (video only)"
                        if height
                        else "video only",
                        "filesize": f.get("filesize") or f.get("filesize_approx"),
                        "type": "video",
                        "url": f_url,
                    },
                )

    duration = info.get("duration")

    return {
        "title": info.get("title", "Unknown"),
        "thumbnail": info.get("thumbnail", ""),
        "duration": str(int(duration)) if duration else None,
        "formats": formats,
    }


@app.get("/health")
async def health():
    return {"status": "ok"}
