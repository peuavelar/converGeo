"""Settings via pydantic-settings. Sem caminhos de usuário hardcoded."""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

ENGINE_ROOT = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(".env", ENGINE_ROOT / ".env"),
        extra="ignore",
    )

    engine_env: str = "development"
    database_url: str = ""
    legacy_schema: str = "convergeo"
    engine_schema: str = "convergeo_engine"
    db_schema: str = "convergeo_engine"
    v1_source: str = "legacy"
    allowed_origins: str = "http://localhost:3000,https://convergeo-front.vercel.app"

    h3_resolution: int = 8
    min_land_area_frac: float = 0.15

    ibge_salvador: str = "2927408"
    ibge_lauro: str = "2919207"

    ibge_malha_path: str = ""
    ibge_setores_path: str = ""
    ibge_setores_gpkg: str = ""
    ibge_agregados_path: str = ""
    ibge_renda_path: str = ""
    ibge_colunas_yaml: str = ""
    rf_cnpj_dir: str = ""
    rf_municipios_csv: str = ""
    rf_tom_ibge_csv: str = ""
    osm_overpass_url: str = "https://overpass-api.de/api/interpreter"

    nominatim_url: str = "https://nominatim.openstreetmap.org"
    nominatim_user_agent: str = (
        "ConverGeo/1.3 (https://github.com/peuavelar/converGeo)"
    )
    nominatim_min_interval_s: float = 1.0
    geo_providers: str = "cep_file,nominatim"
    geo_cep_file: str = ""
    geo_bairro_geojson: str = ""
    bairro_geo_weight: float = 0.4

    min_bucket_n: int = 8
    fair_price_below_pct: float = -0.08
    fair_price_above_pct: float = 0.08
    enable_hedonic: bool = False

    engine_admin_key: str = ""
    engine_admin_key_min_len: int = 32
    api_key_pepper: str = ""
    ingest_max_bytes: int = 5_000_000
    ingest_max_rows: int = 5_000
    feed_max_bytes: int = 8_000_000
    feed_timeout_s: float = 30.0
    rate_limit_per_min: int = 120

    supabase_url: str = ""
    supabase_jwks_url: str = ""
    supabase_jwt_aud: str = "authenticated"
    supabase_production_urls: str = ""

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

    @property
    def is_production(self) -> bool:
        import os

        return (
            self.engine_env.lower() == "production"
            or bool(os.environ.get("RENDER"))
            or bool(os.environ.get("K_SERVICE"))
        )


@lru_cache
def get_settings() -> Settings:
    return Settings()
