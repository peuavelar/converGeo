from __future__ import annotations

from uuid import uuid4

import h3
from fastapi import APIRouter, File, Header, HTTPException, Query, Request, UploadFile

from convergeo_engine.api.explain import explain
from convergeo_engine.api.models import FairPrice, V2Imovel, V2ScoreResponse
from convergeo_engine.auth_jwt import assert_posse_anunciante, require_jwt, require_papel, require_user
from convergeo_engine.config import get_settings
from convergeo_engine.geo import latlng_to_cell
from convergeo_engine.keys import new_api_key, hash_api_key
from convergeo_engine.marketplace.ingest import ingest_csv, ingest_vrsync
from convergeo_engine.scoring import combine, estimate_price, load_profiles
from convergeo_engine.security import rate_limit, require_admin, require_anunciante
from convergeo_engine.store import get_repository

router = APIRouter(prefix="/v2")


def _demo_flag() -> bool:
    return bool(getattr(get_repository(), "demo", False))


@router.get("/score", response_model=V2ScoreResponse)
def v2_score(
    request: Request,
    lat: float = Query(...),
    lng: float = Query(...),
    perfil: str = Query("moradia"),
):
    rate_limit(request)
    profiles = load_profiles()
    if perfil not in profiles["perfis"]:
        raise HTTPException(400, "perfil inválido")
    h3_index = latlng_to_cell(lat, lng)
    repo = get_repository()
    row = repo.get_score_imobiliario(h3_index, perfil)
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
        demo=_demo_flag() or None,
    )


@router.get("/hexagonos")
def v2_hexagonos(request: Request, perfil: str = Query("moradia"), bbox: str | None = None):
    rate_limit(request)
    repo = get_repository()
    rows = repo.list_scores_imobiliario(perfil)
    body = {"perfil": perfil, "hexagonos": rows}
    if _demo_flag():
        body["demo"] = True
    return body


@router.get("/imoveis")
def v2_imoveis(
    request: Request,
    bbox: str | None = None,
    finalidade: str = "venda",
    preco_min: float | None = None,
    preco_max: float | None = None,
    quartos: int | None = None,
    perfil: str = "moradia",
):
    rate_limit(request)
    settings = get_settings()
    repo = get_repository()
    out = []
    precos = repo.list_precos_hex()
    for im in repo.list_imoveis(status="ativo", finalidade=finalidade):
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
                for p in precos
                if p["h3_index"] == im.get("h3_index")
                and p["finalidade"] == im.get("finalidade")
                and (p.get("tipologia") or p.get("tipo")) == im.get("tipo")
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
        score_row = repo.get_score_imobiliario(im.get("h3_index") or "", perfil) if im.get("h3_index") else None
        out.append(
            V2Imovel(
                id=str(im["id"]),
                id_externo=im["id_externo"],
                finalidade=im["finalidade"],
                tipo=im["tipo"],
                preco=float(im["preco"]) if im.get("preco") is not None else None,
                area_util=float(im["area_util"]) if im.get("area_util") is not None else None,
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
    body = {"imoveis": out}
    if _demo_flag():
        body["demo"] = True
    return body


@router.get("/imoveis/{imovel_id}")
def v2_imovel_detail(imovel_id: str, request: Request):
    rate_limit(request)
    repo = get_repository()
    im = repo.get_imovel(imovel_id)
    if not im:
        raise HTTPException(404, "imóvel não encontrado")
    events = repo.list_eventos(imovel_id)
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
    require_admin(x_api_key)
    repo = get_repository()
    raw_key = payload.get("api_key") or new_api_key()
    rec = {
        "id": payload.get("id") or str(uuid4()),
        "tipo": payload.get("tipo") or "imobiliaria",
        "nome": payload.get("nome") or "Anunciante",
        "creci": payload.get("creci"),
        "documento": payload.get("documento"),
        "feed_url": payload.get("feed_url"),
        "feed_formato": payload.get("feed_formato") or "vrsync",
        "api_key_hash": hash_api_key(raw_key),
        "ativo": True,
        "is_seed": False,
    }
    saved = repo.upsert_anunciante(rec)
    public = {k: v for k, v in saved.items() if k not in {"documento", "api_key_hash"}}
    return {"anunciante": public, "api_key": raw_key, "aviso": "A chave é exibida só agora."}


@router.post("/ingest/planilha")
async def ingest_planilha(
    anunciante_id: str = Query(...),
    file: UploadFile = File(...),
    x_api_key: str | None = Header(default=None, alias="X-API-Key"),
):
    require_anunciante(anunciante_id, x_api_key)
    settings = get_settings()
    raw = await file.read()
    if len(raw) > settings.ingest_max_bytes:
        raise HTTPException(413, "CSV acima do limite")
    content = raw.decode("utf-8")
    if content.count("\n") > settings.ingest_max_rows + 1:
        raise HTTPException(413, "muitas linhas")
    return ingest_csv(anunciante_id, content)


@router.post("/anunciantes/{anunciante_id}/feed/sync")
async def sync_feed(
    anunciante_id: str,
    x_api_key: str | None = Header(default=None, alias="X-API-Key"),
):
    require_anunciante(anunciante_id, x_api_key)
    settings = get_settings()
    repo = get_repository()
    an = repo.get_anunciante(anunciante_id)
    if not an:
        raise HTTPException(404, "anunciante não encontrado")
    if not an.get("feed_url"):
        raise HTTPException(404, "anunciante ou feed não encontrado")
    import httpx

    with httpx.Client(timeout=settings.feed_timeout_s) as client:
        res = client.get(an["feed_url"])
        res.raise_for_status()
        raw = res.content
    if len(raw) > settings.feed_max_bytes:
        raise HTTPException(413, "feed acima do limite")
    return ingest_vrsync(anunciante_id, raw)


@router.post("/explicar")
def v2_explicar(payload: dict, request: Request):
    rate_limit(request)
    text = explain(payload.get("explicacao_base") or [])
    return {"texto": text, "fonte": "llm" if get_settings().llm_api_key else "template"}


@router.get("/me")
def v2_me(authorization: str | None = Header(default=None)):
    return require_user(authorization)


@router.post("/cadastro")
def v2_cadastro(payload: dict, authorization: str | None = Header(default=None)):
    ctx = require_jwt(authorization)
    papel = payload.get("papel") or "comprador"
    if papel in {"imobiliaria", "corretor", "incorporadora"}:
        papel = "pendente"
    if papel not in {"comprador", "proprietario", "pendente"}:
        raise HTTPException(400, "papel inválido no cadastro público")
    rec = {
        "user_id": ctx["user_id"],
        "papel": papel,
        "nome": payload.get("nome"),
        "creci": payload.get("creci"),
        "anunciante_id": None,
        "ativo": True,
    }
    return {"perfil": get_repository().upsert_perfil(rec)}


@router.get("/admin/anunciantes")
def v2_admin_anunciantes(authorization: str | None = Header(default=None)):
    require_papel(authorization, {"admin"})
    rows = get_repository().list_anunciantes()
    return {"anunciantes": [{k: v for k, v in a.items() if k != "api_key_hash"} for a in rows]}


@router.patch("/imoveis/{imovel_id}/status")
def v2_imovel_status(
    imovel_id: str,
    payload: dict,
    authorization: str | None = Header(default=None),
):
    ctx = require_papel(authorization, {"admin", "imobiliaria", "corretor", "proprietario", "incorporadora"})
    repo = get_repository()
    im = repo.get_imovel(imovel_id)
    if not im:
        raise HTTPException(404, "imóvel não encontrado")
    assert_posse_anunciante(ctx, str(im.get("anunciante_id")))
    novo = dict(im)
    novo["status"] = payload.get("status") or im.get("status")
    if payload.get("preco_fechamento") is not None:
        novo["preco"] = payload["preco_fechamento"]
    stats = repo.upsert_imoveis(str(im["anunciante_id"]), [novo])
    return stats
