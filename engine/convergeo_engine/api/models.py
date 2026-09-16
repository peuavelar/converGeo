from __future__ import annotations

from pydantic import BaseModel, Field


class V1Breakdown(BaseModel):
    estrutural: float
    macroeconomico: float
    comportamental: float


class V1ScoreOk(BaseModel):
    status: str = "sucesso"
    h3_index: str
    lat: float
    lng: float
    segmento: str
    score_total: float
    breakdown: V1Breakdown


class V1ScoreEmpty(BaseModel):
    status: str = "sem_dados"
    h3_index: str
    mensagem: str


class V1TopOk(BaseModel):
    status: str = "sucesso"
    segmento: str
    recomendacoes: list[dict]


class V2ScoreResponse(BaseModel):
    h3_index: str
    perfil: str
    score_total: float | None
    breakdown: dict[str, float | None]
    cobertura: dict[str, bool]
    vizinhos: list[str]
    explicacao_base: list[dict]


class FairPrice(BaseModel):
    preco_estimado: float | None = None
    desvio_pct: float | None = None
    faixa: str | None = None
    confianca: float | None = None


class V2Imovel(BaseModel):
    id: str
    id_externo: str
    finalidade: str
    tipo: str
    preco: float | None
    area_util: float | None
    quartos: int | None
    lat: float | None
    lng: float | None
    h3_index: str | None
    endereco_bairro: str | None = None
    ocultar_endereco: bool = False
    fotos: list[str] = Field(default_factory=list)
    score_regiao: float | None = None
    preco_justo: FairPrice | None = None
