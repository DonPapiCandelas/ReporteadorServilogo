# app/main.py
import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.responses import JSONResponse
from fastapi import HTTPException
import datetime
import os
from dotenv import load_dotenv

load_dotenv()
# Importamos los NUEVOS routers
from . import security, models
from .reports import receivables
from .database import engine

# --- Configuración de Logging (¡La dejamos!) ---
log_path = os.getenv("LOG_FILE_PATH", "api_debug.log")  # Y ahora usa esa variable en lugar del texto fijo
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[
        logging.FileHandler(log_path),
        logging.StreamHandler()
    ]
)
log = logging.getLogger(__name__)

# --- Creación de la App ---
models.Base.metadata.create_all(bind=engine)
app = FastAPI(title="Reporting App API", version="0.1.0")

# --- Middlewares (CORS y Logging) ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"]
)

@app.middleware("http")
async def log_requests(request: Request, call_next):
    # ... (Toda tu lógica de logging middleware se queda igual) ...
    path = request.url.path
    method = request.method
    body_preview = "(body not read)"
    try:
        if method == "POST" and path == "/api/token":
            body = await request.body()
            body_preview = body.decode(errors="ignore")
            if "password=" in body_preview:
                body_preview = body_preview.replace(
                    body_preview.split("password=")[-1].split("&")[0],
                    "********"
                )
            log.info(f"[API] REQ: {method} {path} body={body_preview}")
            async def receive():
                return {"type": "http.request", "body": body}
            request._receive = receive
        else:
             log.info(f"[API] REQ: {method} {path}")
        response = await call_next(request)
        log.info(f"[API] RES: {method} {path} -> {response.status_code}")
        return response
    except Exception as e:
        log.exception(f"[API] EXC: {method} {path} -> EXCEPTION: {e}")
        return JSONResponse(status_code=500, content={"detail": f"Internal Server Error: {e}"})

# --- Handlers de Errores (¡Los dejamos!) ---
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    log.warning(f"[API] HTTPException: {request.method} {request.url.path} -> {exc.status_code} {exc.detail}")
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})

@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    log.exception(f"[API] Unhandled Exception: {request.method} {request.url.path} -> {str(exc)}")
    return JSONResponse(status_code=500, content={"detail": "Internal Server Error"})

# --- ¡LA PARTE MÁS IMPORTANTE! (El Enrutamiento Correcto) ---
# Usamos 'include_router' para que la Inyección de Dependencias funcione
app.include_router(security.router, prefix="/api") # Incluye /api/token, /api/users, etc.
app.include_router(receivables.router, prefix="/api/reports") # Incluye /api/reports/...

# --- Endpoints de la Raíz ---
@app.get("/")
def read_root():
    return {"message": "Welcome to the Reports API!"}

@app.get("/api/ping")
def ping():
    log.info("[API] /api/ping PONG!")
    return {"ok": True, "ts": datetime.datetime.utcnow().isoformat()}