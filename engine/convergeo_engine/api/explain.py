"""IA explicativa: só reescreve fatores recebidos. Fallback determinístico."""

from __future__ import annotations

from convergeo_engine.config import get_settings


def template_explain(fatores: list[dict]) -> str:
    partes = []
    for f in fatores:
        if not f.get("presente"):
            partes.append(f"{f.get('camada')}: sem dado nesta camada (peso {f.get('peso')}).")
            continue
        partes.append(
            f"{f.get('camada')}: valor {f.get('valor')} com peso {f.get('peso')}."
        )
    if not partes:
        return "Não há fatores estruturados para explicar este hexágono."
    return " ".join(partes)


def explain(fatores: list[dict]) -> str:
    """Nunca inventa números: só interpola o que veio em explicacao_base."""
    settings = get_settings()
    base = template_explain(fatores)
    if not settings.llm_api_key or not settings.llm_provider:
        return base
    # Provedor configurável; se falhar, template.
    try:
        import httpx

        prompt = (
            "Reescreva em português curto os fatores abaixo. "
            "PROIBIDO inventar números ou afirmações que não estejam na lista.\n"
            f"{fatores}"
        )
        # Adapter mínimo OpenAI-compatível
        url = "https://api.openai.com/v1/chat/completions"
        headers = {"Authorization": f"Bearer {settings.llm_api_key}"}
        body = {
            "model": settings.llm_model or "gpt-4o-mini",
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0,
        }
        with httpx.Client(timeout=settings.llm_timeout_s) as client:
            res = client.post(url, json=body, headers=headers)
            res.raise_for_status()
            text = res.json()["choices"][0]["message"]["content"]
        return text
    except Exception:
        return base
