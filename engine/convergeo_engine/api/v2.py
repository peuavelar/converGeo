from __future__ import annotations

from uuid import uuid4

import h3
from fastapi import APIRouter, File, Header, HTTPException, Query, UploadFile

from convergeo_engine.api.explain import explain
from convergeo_engine.api.models import FairPrice, V2Imovel, V2ScoreResponse
from convergeo_engine.config import get_settings
from convergeo_engine.geo import latlng_to_cell
from convergeo_engine.marketplace.ingest import hash_api_key, ingest_csv, ingest_vrsync
from convergeo_engine.scoring import combine, estimate_price, load_profiles
from convergeo_engine.store import get_store

router = APIRouter(prefix="/v2")


def _auth(x_api_key: str | None) -> None:
    settings = get_settings()
    if not settings.engine_admin_key:
        return
    if not x_api_key or hash_api_key(x_api_key) != hash_api_key(settings.engine_admin_key):
        raise HTTPException(status_code=401, detail="API key inválida")


@router.get("/score", response_model=V2ScoreResponse)
def v2_score(
    lat: float = Query(...),
    lng: float = Query(...),
    perfil: str = Query("moradia"),
):
    profiles = load_profiles()
    if perfil not in profiles["perfis"]:
        raise HTTPException(400, "perfil inválido")
    h3_index = latlng_to_cell(lat, lng)
    store = get_store()
    row = next(
        (s for s in store.scores_imobiliario if s["h3_index"] == h3_index and s["perfil"] == perfil),
        None,
    )
    pesos = profiles["perfis"][perfil]["pesos"]
    if row:
        layers = {
            "estrutural": row.get("estrutural"),
            "macroeconomica": row.get("macroeconomica"),
            "acessibilidade": row.get("acessibilidade"),
            "mercado": row.get("mercado"),
        }
        total, cobertura = combine(layers, pesos)
    else:
        layers = {k: None for k in pesos}
        total, cobertura = None, {k: False for k in pesos}
    try:
        vizinhos = list(h3.grid_disk(h3_index, 1))
    except Exception:
        vizinhos = [h3_index]
    fatores = [
        {"camada": k, "valor": layers.get(k), "peso": pesos[k], "presente": cobertura[k]}
        for k in pesos
    ]
    return V2ScoreResponse(
        h3_index=h3_index,
        perfil=perfil,
        score_total=total,
        breakdown=layers,
        cobertura=cobertura,
        vizinhos=vizinhos,
        explicacao_base=fatores,
    )


@router.get("/hexagonos")
def v2_hexagonos(perfil: str = Query("moradia"), bbox: str | None = None):
    store = get_store()
    rows = [s for s in store.scores_imobiliario if s.get("perfil") == perfil]
    return {"perfil": perfil, "hexagonos": rows}


@router.get("/imoveis")
def v2_imoveis(
    bbox: str | None = None,
    finalidade: str = "venda",
    preco_min: float | None = None,
    preco_max: float | None = None,
    quartos: int | None = None,
    perfil: str = "moradia",
):
    settings = get_settings()
    store = get_store()
    out = []
    for im in store.imoveis:
        if im.get("status") != "ativo":
            continue
        if im.get("finalidade") != finalidade:
            continue
        if preco_min is not None and (im.get("preco") or 0) < preco_min:
            continue
        if preco_max is not None and (im.get("preco") or 0) > preco_max:
            continue
        if quartos is not None and im.get("quartos") != quartos:
            continue
        pub_lat, pub_lng = im.get("lat"), im.get("lng")
        if im.get("ocultar_endereco") and im.get("h3_index"):
            pub_lat, pub_lng = h3.cell_to_latlng(im["h3_index"])
        px = next(
            (
                p
                for p in store.precos_hex
                if p["h3_index"] == im.get("h3_index")
                and p["finalidade"] == im.get("finalidade")
                and p["tipologia"] == im.get("tipo")
            ),
            None,
        )
        fair = None
        if px and im.get("area_util") and im.get("preco"):
            fair = estimate_price(
                float(im["area_util"]),
                float(px["mediana_m2"]),
                n=int(px["n"]),
                nivel=px["nivel_fallback"],
                below=settings.fair_price_below_pct,
                above=settings.fair_price_above_pct,
                preco=float(im["preco"]),
            )
        score_row = next(
            (
                s
                for s in store.scores_imobiliario
                if s["h3_index"] == im.get("h3_index") and s["perfil"] == perfil
            ),
            None,
        )
        out.append(
            V2Imovel(
                id=im["id"],
                id_externo=im["id_externo"],
                finalidade=im["finalidade"],
                tipo=im["tipo"],
                preco=im.get("preco"),
                area_util=im.get("area_util"),
                quartos=im.get("quartos"),
                lat=pub_lat,
                lng=pub_lng,
                h3_index=im.get("h3_index"),
                endereco_bairro=im.get("endereco_bairro") if not im.get("ocultar_endereco") else None,
                ocultar_endereco=bool(im.get("ocultar_endereco")),
                fotos=im.get("fotos") or [],
                score_regiao=score_row.get("score_total") if score_row else None,
                preco_justo=FairPrice(**fair) if fair else None,
            ).model_dump()
        )
    return {"imoveis": out}


@router.get("/imoveis/{imovel_id}")
def v2_imovel_detail(imovel_id: str):
    store = get_store()
    im = next((i for i in store.imoveis if i["id"] == imovel_id), None)
    if not im:
        raise HTTPException(404, "imóvel não encontrado")
    events = [e for e in store.imovel_eventos if e["imovel_id"] == imovel_id]
    public = dict(im)
    if public.get("ocultar_endereco"):
        public["endereco_logradouro"] = None
        public["endereco_numero"] = None
        public["documento"] = None
        if public.get("h3_index"):
            public["lat"], public["lng"] = h3.cell_to_latlng(public["h3_index"])
    return {"imovel": public, "eventos": events}


@router.post("/anunciantes")
def create_anunciante(
    payload: dict,
    x_api_key: str | None = Header(default=None, alias="X-API-Key"),
):
    _auth(x_api_key)
    store = get_store()
    rec = {
        "id": payload.get("id") or str(uuid4()),
        "tipo": payload.get("tipo") or "imobiliaria",
        "nome": payload.get("nome") or "Anunciante",
        "creci": payload.get("creci"),
        "documento": payload.get("documento"),
        "feed_url": payload.get("feed_url"),
        "feed_formato": payload.get("feed_formato") or "vrsync",
        "api_key_hash": hash_api_key(payload["api_key"]) if payload.get("api_key") else None,
        "ativo": True,
        "is_seed": False,
    }
    store.anunciantes.append(rec)
    public = {k: v for k, v in rec.items() if k != "documento"}
    return {"anunciante": public}


@router.post("/ingest/planilha")
async def ingest_planilha(
    anunciante_id: str = Query(...),
    file: UploadFile = File(...),
    x_api_key: str | None = Header(default=None, alias="X-API-Key"),
):
    _auth(x_api_key)
    content = (await file.read()).decode("utf-8")
    return ingest_csv(anunciante_id, content)


@router.post("/anunciantes/{anunciante_id}/feed/sync")
async def sync_feed(
    anunciante_id: str,
    x_api_key: str | None = Header(default=None, alias="X-API-Key"),
):
    _auth(x_api_key)
    store = get_store()
    an = next((a for a in store.anunciantes if a["id"] == anunciante_id), None)
    if not an:
        raise HTTPException(404, "anunciante não encontrado")
    raw = an.get("feed_bytes")
    if raw is None and an.get("feed_url"):
        import httpx

        with httpx.Client(timeout=30.0) as client:
            res = client.get(an["feed_url"])
            res.raise_for_status()
            raw = res.content
    if not raw:
        raise HTTPException(404, "anunciante ou feed não encontrado")
    return ingest_vrsync(anunciante_id, raw)


@router.post("/explicar")
def v2_explicar(payload: dict):
    text = explain(payload.get("explicacao_base") or [])
    return {"texto": text, "fonte": "llm" if get_settings().llm_api_key else "template"}
