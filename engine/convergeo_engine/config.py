"""Settings via pydantic-settings. Sem caminhos de usuário hardcoded."""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

ENGINE_ROOT = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(".env", ENGINE_ROOT / ".env"),
        extra="ignore",
    )

    database_url: str = ""
    db_schema: str = "convergeo"
    allowed_origins: str = "http://localhost:3000,https://convergeo-front.vercel.app"

    h3_resolution: int = 8
    min_land_area_frac: float = 0.15

    # Fonte: IBGE — Códigos dos Municípios
    # https://www.ibge.gov.br/explica/codigos-dos-municipios.php
    ibge_salvador: str = "2927408"
    ibge_lauro: str = "2919207"

    ibge_malha_path: str = ""
    ibge_setores_path: str = ""
    ibge_renda_path: str = ""
    rf_cnpj_dir: str = ""
    rf_municipios_csv: str = ""
    osm_overpass_url: str = "https://overpass-api.de/api/interpreter"

    nominatim_url: str = "https://nominatim.openstreetmap.org"
    nominatim_user_agent: str = (
        "ConverGeo/1.3 (https://github.com/peuavelar/converGeo)"
    )
    nominatim_min_interval_s: float = 1.0
    bairro_geo_weight: float = 0.4

    min_bucket_n: int = 8
    fair_price_below_pct: float = -0.08
    fair_price_above_pct: float = 0.08
    enable_hedonic: bool = False

    engine_admin_key: str = ""
    llm_provider: str = ""
    llm_model: str = ""
    llm_api_key: str = ""
    llm_timeout_s: float = 8.0

    @property
    def ibge_municipios(self) -> tuple[str, str]:
        return (self.ibge_salvador, self.ibge_lauro)

    @property
    def cors_origins(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
