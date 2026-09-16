"""Ingestão CSV + upsert de imóveis com eventos de preço/status."""

from __future__ import annotations

import csv
import hashlib
import io
from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

from convergeo_engine.marketplace.feeds.vrsync import parse_vrsync
from convergeo_engine.marketplace.quality import quality_pipeline
from convergeo_engine.store import MemoryStore, get_store

TEMPLATE_FIELDS = [
    "id_externo",
    "finalidade",
    "tipo",
    "preco",
    "condominio",
    "iptu",
    "area_util",
    "area_total",
    "quartos",
    "suites",
    "banheiros",
    "vagas",
    "ano_construcao",
    "endereco_logradouro",
    "endereco_numero",
    "endereco_bairro",
    "endereco_cidade",
    "cep",
    "lat",
    "lng",
    "ocultar_endereco",
    "descricao",
    "fotos",
    "status",
]


def hash_api_key(raw: str) -> str:
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def parse_csv(content: str) -> tuple[list[dict], list[dict]]:
    reader = csv.DictReader(io.StringIO(content))
    ok, errors = [], []
    for i, row in enumerate(reader, start=2):
        try:
            rec = {
                "id_externo": row.get("id_externo") or f"row-{i}",
                "finalidade": (row.get("finalidade") or "venda").lower(),
                "tipo": row.get("tipo") or "apartamento",
                "preco": float(row["preco"]) if row.get("preco") else None,
                "condominio": _opt_float(row.get("condominio")),
                "iptu": _opt_float(row.get("iptu")),
                "area_util": _opt_float(row.get("area_util")),
                "area_total": _opt_float(row.get("area_total")),
                "quartos": _opt_int(row.get("quartos")),
                "suites": _opt_int(row.get("suites")),
                "banheiros": _opt_int(row.get("banheiros")),
                "vagas": _opt_int(row.get("vagas")),
                "ano_construcao": _opt_int(row.get("ano_construcao")),
                "endereco_logradouro": row.get("endereco_logradouro"),
                "endereco_numero": row.get("endereco_numero"),
                "endereco_bairro": row.get("endereco_bairro"),
                "endereco_cidade": row.get("endereco_cidade"),
                "cep": row.get("cep"),
                "lat": _opt_float(row.get("lat")),
                "lng": _opt_float(row.get("lng")),
                "ocultar_endereco": str(row.get("ocultar_endereco") or "").lower() in {"1", "true", "sim"},
                "descricao": row.get("descricao"),
                "fotos": [u for u in (row.get("fotos") or "").split("|") if u],
                "status": row.get("status") or "ativo",
                "qualidade_flags": [],
            }
            ok.append(rec)
        except (TypeError, ValueError) as exc:
            errors.append({"linha": i, "erro": str(exc)})
    return ok, errors


def _opt_float(v: str | None) -> float | None:
    if v is None or v == "":
        return None
    return float(v.replace(",", "."))


def _opt_int(v: str | None) -> int | None:
    if v is None or v == "":
        return None
    return int(float(v))


def upsert_listings(anunciante_id: str, listings: list[dict], store: MemoryStore | None = None) -> dict:
    store = store or get_store()
    created = updated = events = 0
    now = datetime.now(timezone.utc).isoformat()
    existing = {
        (i["anunciante_id"], i["id_externo"]): i
        for i in store.imoveis
        if i["anunciante_id"] == anunciante_id
    }
    for raw in listings:
        key = (anunciante_id, raw["id_externo"])
        prev = existing.get(key)
        if prev is None:
            rec = {
                **raw,
                "id": str(uuid4()),
                "anunciante_id": anunciante_id,
                "atualizado_em": now,
            }
            store.imoveis.append(rec)
            store.imovel_eventos.append(
                {
                    "imovel_id": rec["id"],
                    "evento": "criado",
                    "valor_anterior": None,
                    "valor_novo": str(rec.get("preco")),
                    "ocorrido_em": now,
                }
            )
            created += 1
            events += 1
            existing[key] = rec
        else:
            changed_price = prev.get("preco") != raw.get("preco")
            changed_status = prev.get("status") != raw.get("status")
            if changed_price:
                store.imovel_eventos.append(
                    {
                        "imovel_id": prev["id"],
                        "evento": "preco_alterado",
                        "valor_anterior": str(prev.get("preco")),
                        "valor_novo": str(raw.get("preco")),
                        "ocorrido_em": now,
                    }
                )
                events += 1
            if changed_status:
                store.imovel_eventos.append(
                    {
                        "imovel_id": prev["id"],
                        "evento": "status_alterado",
                        "valor_anterior": str(prev.get("status")),
                        "valor_novo": str(raw.get("status")),
                        "ocorrido_em": now,
                    }
                )
                events += 1
            prev.update({**raw, "id": prev["id"], "anunciante_id": anunciante_id, "atualizado_em": now})
            updated += 1
    return {"created": created, "updated": updated, "events": events, "total": len(listings)}


def ingest_csv(anunciante_id: str, content: str, store: MemoryStore | None = None) -> dict:
    rows, errors = parse_csv(content)
    cleaned = quality_pipeline(rows, "venda") + [
        r for r in quality_pipeline(rows, "aluguel") if r.get("finalidade") == "aluguel"
    ]
    # quality_pipeline splits; merge unique by id_externo
    by_id = {r["id_externo"]: r for r in cleaned}
    stats = upsert_listings(anunciante_id, list(by_id.values()), store)
    stats["errors"] = errors
    return stats


def ingest_vrsync(anunciante_id: str, xml_bytes: bytes, store: MemoryStore | None = None) -> dict:
    listings = parse_vrsync(xml_bytes)
    return upsert_listings(anunciante_id, listings, store)
