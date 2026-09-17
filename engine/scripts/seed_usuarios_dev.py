"""Cria usuários de desenvolvimento via Admin API do Supabase. Nunca em produção."""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path

import httpx

from convergeo_engine.config import ENGINE_ROOT, get_settings

EXAMPLE = ENGINE_ROOT / "seeds" / "usuarios_dev.example.json"
SEED = ENGINE_ROOT / "seeds" / "usuarios_dev.json"


def main() -> int:
    settings = get_settings()
    if settings.is_production or settings.engine_env.lower() == "production":
        print("Recusado: ENGINE_ENV=production")
        return 2
    url = (settings.supabase_url or os.environ.get("SUPABASE_URL") or "").rstrip("/")
    if not url:
        print("SUPABASE_URL / supabase_url ausente")
        return 2
    blocked = [u.strip() for u in settings.supabase_production_urls.split(",") if u.strip()]
    if any(url.startswith(b.rstrip("/")) for b in blocked):
        print("Recusado: URL de produção na lista SUPABASE_PRODUCTION_URLS")
        return 2
    service = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or ""
    if not service:
        print("SUPABASE_SERVICE_ROLE_KEY ausente")
        return 2
    path = SEED if SEED.is_file() else EXAMPLE
    users = json.loads(path.read_text(encoding="utf-8"))
    headers = {
        "apikey": service,
        "Authorization": f"Bearer {service}",
        "Content-Type": "application/json",
    }
    with httpx.Client(timeout=30.0) as client:
        for u in users:
            payload = {
                "email": u["email"],
                "password": u.get("senha") or u.get("password"),
                "email_confirm": True,
                "user_metadata": {"nome": u.get("nome"), "papel": u.get("papel")},
            }
            res = client.post(f"{url}/auth/v1/admin/users", headers=headers, json=payload)
            print(u["email"], res.status_code)
            if res.status_code >= 400:
                print(res.text)
                return 1
            user_id = res.json().get("id")
            if user_id:
                from convergeo_engine.store import get_repository

                get_repository().upsert_perfil(
                    {
                        "user_id": user_id,
                        "papel": u.get("papel") or "comprador",
                        "nome": u.get("nome"),
                        "creci": u.get("creci"),
                        "ativo": True,
                    }
                )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
