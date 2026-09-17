from shapely.geometry import box

from convergeo_engine.geo import area_apportion, geocode_with_fallback, mask_hexes, MemoryGeoCache


class FakeProvider:
    def __init__(self, cep=None, endereco=None, bairro=None):
        self.cep = cep
        self.endereco = endereco
        self.bairro = bairro

    def geocode_cep(self, cep: str):
        return self.cep

    def geocode_endereco(self, query: str):
        return self.endereco

    def geocode_bairro(self, bairro: str, municipio: str):
        return self.bairro


def test_mask_discards_sea_hexes():
    land = box(-38.52, -13.02, -38.48, -12.98)
    hexes = mask_hexes([("2927408", land)], resolution=8, min_land_frac=0.15)
    assert len(hexes) >= 1
    assert all(h["pct_area_terrestre"] >= 0.15 for h in hexes)
    assert all(h["municipio_ibge"] == "2927408" for h in hexes)


def test_area_apportion_two_sectors_three_hexes():
    s1 = box(0, 0, 2, 2)
    s2 = box(2, 0, 4, 2)
    h1 = box(0, 0, 2, 1)
    h2 = box(0, 1, 2, 2)
    h3 = box(2, 0, 4, 2)
    rows = area_apportion(
        [("S1", s1, 100, 40), ("S2", s2, 50, 20)],
        [("H1", h1), ("H2", h2), ("H3", h3)],
    )
    by = {r["h3_index"]: r for r in rows}
    # Fração geodésica ≈ planar perto do equador; tolerância 0.02.
    assert abs(by["H1"]["populacao"] - 50) < 0.02
    assert abs(by["H2"]["populacao"] - 50) < 0.02
    assert abs(by["H3"]["populacao"] - 50) < 0.02


def test_geocode_fallback_cep_then_endereco_then_bairro():
    cache = MemoryGeoCache()
    r1 = geocode_with_fallback(
        cep="41810000",
        endereco="x",
        bairro="Pituba",
        municipio="2927408",
        provider=FakeProvider(cep=(-13.0, -38.4)),
        cache=cache,
    )
    assert r1.precisao == "cep"
    r2 = geocode_with_fallback(
        cep="000",
        endereco="Rua Ceará",
        bairro="Pituba",
        municipio="2927408",
        provider=FakeProvider(endereco=(-13.01, -38.45)),
        cache=MemoryGeoCache(),
    )
    assert r2.precisao == "endereco"
    r3 = geocode_with_fallback(
        cep=None,
        endereco=None,
        bairro="Pituba",
        municipio="2927408",
        provider=FakeProvider(bairro=(-12.9, -38.3)),
        cache=MemoryGeoCache(),
    )
    assert r3.precisao == "bairro"
    r4 = geocode_with_fallback(
        cep=None,
        endereco=None,
        bairro=None,
        municipio=None,
        provider=FakeProvider(),
        cache=MemoryGeoCache(),
    )
    assert r4.precisao == "sem"
