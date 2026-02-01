import json
import os
import subprocess
import tempfile
import time
from collections import defaultdict
from pathlib import Path

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

app = FastAPI(title="MediaGrab API")

allowed_origins = os.environ.get("ALLOWED_ORIGINS", "http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_methods=["GET", "POST"],
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


def _run_ytdlp(args: list[str], timeout: int = 25) -> subprocess.CompletedProcess:
    try:
        return subprocess.run(
            ["yt-dlp"] + args,
            capture_output=True,
            text=True,
            timeout=timeout,
        )
    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=504, detail="Extraction timed out")
    except FileNotFoundError:
        raise HTTPException(status_code=500, detail="yt-dlp is not installed on the server")


def _pick_video_tiers(info: dict) -> list[dict]:
    """Pick 3 video tiers: highest, mid, lowest from available formats."""
    all_formats = info.get("formats", [])

    # Collect all formats that have video (we'll merge audio via yt-dlp at download time)
    video_fmts = []
    for f in all_formats:
        vcodec = f.get("vcodec", "none")
        if vcodec == "none":
            continue
        height = f.get("height")
        if not height:
            continue
        video_fmts.append(f)

    if not video_fmts:
        return []

    # Deduplicate by height, keeping the best bitrate per height
    by_height: dict[int, dict] = {}
    for f in video_fmts:
        h = f["height"]
        existing = by_height.get(h)
        if not existing or (f.get("tbr") or 0) > (existing.get("tbr") or 0):
            by_height[h] = f

    heights = sorted(by_height.keys(), reverse=True)

    if len(heights) == 0:
        return []

    tiers = []

    # Highest
    h = heights[0]
    f = by_height[h]
    tiers.append({
        "tier": "highest",
        "label": f"{h}p",
        "height": h,
        "ext": "mp4",
        "filesize": f.get("filesize") or f.get("filesize_approx"),
    })

    if len(heights) >= 3:
        # Mid = middle of the list
        mid_idx = len(heights) // 2
        h = heights[mid_idx]
        f = by_height[h]
        tiers.append({
            "tier": "mid",
            "label": f"{h}p",
            "height": h,
            "ext": "mp4",
            "filesize": f.get("filesize") or f.get("filesize_approx"),
        })

        # Lowest
        h = heights[-1]
        f = by_height[h]
        tiers.append({
            "tier": "lowest",
            "label": f"{h}p",
            "height": h,
            "ext": "mp4",
            "filesize": f.get("filesize") or f.get("filesize_approx"),
        })
    elif len(heights) == 2:
        # Only 2 available: highest + lowest
        h = heights[-1]
        f = by_height[h]
        tiers.append({
            "tier": "lowest",
            "label": f"{h}p",
            "height": h,
            "ext": "mp4",
            "filesize": f.get("filesize") or f.get("filesize_approx"),
        })

    return tiers


def _pick_best_audio(info: dict) -> dict | None:
    """Pick the single best audio format."""
    all_formats = info.get("formats", [])
    best = None
    best_abr = 0

    for f in all_formats:
        vcodec = f.get("vcodec", "none")
        acodec = f.get("acodec", "none")
        if vcodec != "none" or acodec == "none":
            continue
        abr = f.get("abr") or 0
        if abr >= best_abr:
            best_abr = abr
            best = f

    if not best:
        return None

    abr = best.get("abr")
    return {
        "tier": "highest",
        "label": f"{int(abr)}kbps" if abr else "Best",
        "ext": "mp3",
        "filesize": best.get("filesize") or best.get("filesize_approx"),
    }


@app.post("/extract")
async def extract(request: ExtractRequest):
    url = request.url.strip()
    if not url:
        raise HTTPException(status_code=400, detail="URL is required")

    result = _run_ytdlp([
        "--dump-json",
        "--no-download",
        "--no-warnings",
        "--no-playlist",
        url,
    ])

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

    video_tiers = _pick_video_tiers(info)
    audio_tier = _pick_best_audio(info)

    duration = info.get("duration")

    return {
        "title": info.get("title", "Unknown"),
        "thumbnail": info.get("thumbnail", ""),
        "duration": str(int(duration)) if duration else None,
        "video_formats": video_tiers,
        "audio_format": audio_tier,
    }


@app.get("/download")
async def download(
    url: str = Query(...),
    mode: str = Query(..., pattern="^(video|audio)$"),
    quality: str = Query("highest", pattern="^(highest|mid|lowest)$"),
    title: str = Query("download"),
):
    """Download media via yt-dlp and stream the file to the client."""

    if mode == "video":
        # Map quality tier to height filter
        height_map = {"highest": "", "mid": "[height<=720]", "lowest": "[height<=360]"}
        height_filter = height_map.get(quality, "")
        format_str = f"bestvideo{height_filter}+bestaudio/best{height_filter}"
        ext = "mp4"
        merge_args = ["--merge-output-format", "mp4"]
    else:
        format_str = "bestaudio/best"
        ext = "mp3"
        merge_args = ["--extract-audio", "--audio-format", "mp3"]

    safe_title = "".join(c for c in title if c.isalnum() or c in " -_").strip() or "download"
    filename = f"{safe_title}.{ext}"

    with tempfile.TemporaryDirectory() as tmpdir:
        output_path = os.path.join(tmpdir, f"output.{ext}")

        cmd = [
            "yt-dlp",
            "-f", format_str,
            *merge_args,
            "--no-playlist",
            "--no-warnings",
            "-o", output_path,
            url,
        ]

        try:
            proc = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
        except subprocess.TimeoutExpired:
            raise HTTPException(status_code=504, detail="Download timed out")

        if proc.returncode != 0:
            raise HTTPException(status_code=500, detail="Download failed")

        # Find the actual output file (yt-dlp may change extension)
        actual_file = None
        for f in Path(tmpdir).iterdir():
            if f.is_file():
                actual_file = f
                break

        if not actual_file or not actual_file.exists():
            raise HTTPException(status_code=500, detail="Download produced no file")

        file_bytes = actual_file.read_bytes()
        actual_ext = actual_file.suffix.lstrip(".")

        def iter_file():
            yield file_bytes

        return StreamingResponse(
            iter_file(),
            media_type="application/octet-stream",
            headers={
                "Content-Disposition": f'attachment; filename="{safe_title}.{actual_ext}"',
                "Content-Length": str(len(file_bytes)),
            },
        )


@app.get("/health")
async def health():
    return {"status": "ok"}
