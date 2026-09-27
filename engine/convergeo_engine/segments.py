"""Segmentos do modo Negócio — mesmos IDs do front (app/data/segments.ts)."""

from __future__ import annotations

from typing import Final

# Categorias OSM que entram no score comportamental de cada segmento.
OSM_POR_SEGMENTO: Final[dict[str, frozenset[str]]] = {
    "food_service": frozenset({"restaurant", "cafe", "fast_food", "bar"}),
    "padaria": frozenset({"bakery", "confectionery"}),
    "cafe": frozenset({"cafe", "coffee"}),
    "farmacia": frozenset({"pharmacy"}),
    "clinica": frozenset({"saude", "clinic", "hospital", "doctors"}),
    "otica": frozenset({"optician"}),
    "academia": frozenset({"fitness", "gym", "sports"}),
    "beleza": frozenset({"hairdresser", "beauty"}),
    "vestuario": frozenset({"clothes", "fashion"}),
    "supermercado": frozenset({"supermercado", "supermarket", "convenience"}),
    "pet": frozenset({"pet"}),
    "papelaria": frozenset({"stationery", "books"}),
    "construcao": frozenset({"doityourself", "hardware"}),
    "posto": frozenset({"fuel"}),
    "hotel": frozenset({"hotel", "guest_house"}),
    "educacao": frozenset({"school", "university", "college"}),
    "imobiliaria": frozenset({"estate_agent"}),
}

# Prefixos CNAE para a camada macro quando o ZIP da Receita existir.
CNAE_PREFIXOS: Final[dict[str, tuple[str, ...]]] = {
    "food_service": ("5611", "5620"),
    "padaria": ("1091", "4721"),
    "cafe": ("5611",),
    "farmacia": ("4771",),
    "clinica": ("8630", "8610"),
    "otica": ("4774",),
    "academia": ("9313",),
    "beleza": ("9602",),
    "vestuario": ("4781", "4782"),
    "supermercado": ("4711", "4712"),
    "pet": ("4789",),
    "papelaria": ("4761",),
    "construcao": ("4744", "4741"),
    "posto": ("4731",),
    "hotel": ("5510",),
    "educacao": ("8599", "8511", "8512", "8520"),
    "imobiliaria": ("6821", "6810"),
}

SEGMENTOS: Final[tuple[str, ...]] = tuple(OSM_POR_SEGMENTO.keys())

PESOS_V1 = {
    "estrutural": 0.35,
    "macroeconomico": 0.40,
    "comportamental": 0.25,
}
