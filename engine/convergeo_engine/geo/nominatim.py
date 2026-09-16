"""Adapter Nominatim: User-Agent identificado, ≤ 1 req/s, cache no chamador."""

from __future__ import annotations

import time

import httpx

from convergeo_engine.config import Settings, get_settings


class NominatimProvider:
    def __init__(self, settings: Settings | None = None) -> None:
        self.settings = settings or get_settings()
        self._last = 0.0

    def _wait(self) -> None:
        gap = self.settings.nominatim_min_interval_s
        now = time.monotonic()
        wait = self._last + gap - now
        if wait > 0:
            time.sleep(wait)
        self._last = time.monotonic()

    def _search(self, params: dict[str, str]) -> tuple[float, float] | None:
        self._wait()
        url = self.settings.nominatim_url.rstrip("/") + "/search"
        headers = {"User-Agent": self.settings.nominatim_user_agent}
        with httpx.Client(timeout=20.0) as client:
            res = client.get(url, params={**params, "format": "json", "limit": "1"}, headers=headers)
            res.raise_for_status()
            data = res.json()
        if not data:
            return None
        return float(data[0]["lat"]), float(data[0]["lon"])

    def geocode_cep(self, cep: str) -> tuple[float, float] | None:
        digits = "".join(ch for ch in cep if ch.isdigit())
        if len(digits) < 8:
            return None
        return self._search({"postalcode": digits, "country": "Brazil"})

    def geocode_endereco(self, query: str) -> tuple[float, float] | None:
        if not query.strip():
            return None
        return self._search({"q": f"{query}, Bahia, Brazil"})

    def geocode_bairro(self, bairro: str, municipio: str) -> tuple[float, float] | None:
        city = "Salvador" if municipio == "2927408" else "Lauro de Freitas"
        return self._search({"q": f"{bairro}, {city}, Bahia, Brazil"})
