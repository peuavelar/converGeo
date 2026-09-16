from convergeo_engine.api.explain import explain, template_explain
from convergeo_engine.scoring import combine, fair_price_band, load_profiles, winsorize
from convergeo_engine.scoring.compute import compute_scores_v2
from convergeo_engine.store import MemoryStore


def test_profiles_sum_to_one():
    data = load_profiles()
    for cfg in data["perfis"].values():
        assert abs(sum(cfg["pesos"].values()) - 1) < 1e-9


def test_missing_layer_renormalizes():
    pesos = {"a": 0.5, "b": 0.5}
    score, cob = combine({"a": 8, "b": None}, pesos)
    assert cob == {"a": True, "b": False}
    assert score == 8


def test_fair_price_band():
    assert fair_price_band(-0.2, -0.08, 0.08) == "abaixo"
    assert fair_price_band(0.0, -0.08, 0.08) == "justo"
    assert fair_price_band(0.2, -0.08, 0.08) == "acima"


def test_winsorize_clips_tails():
    w = winsorize([1, 2, 3, 4, 100])
    assert max(w) < 100 or w[-1] <= w[3] + 50


def test_explain_does_not_invent_numbers():
    fatores = [{"camada": "renda", "valor": 7.2, "peso": 0.3, "presente": True}]
    text = explain(fatores)
    assert "7.2" in text
    assert "99.9" not in text
    assert "renda" in text


def test_compute_v2_renormalizes_missing_layers():
    store = MemoryStore()
    store.hexagonos = [{"h3_index": "888116db69fffff"}]
    store.demografico = [
        {
            "h3_index": "888116db69fffff",
            "populacao": 100,
            "renda_media": 4000,
        }
    ]
    n = compute_scores_v2(store)
    assert n == 3
    row = next(s for s in store.scores_imobiliario if s["perfil"] == "moradia")
    assert row["cobertura"]["estrutural"] is True
    assert row["cobertura"]["macroeconomica"] is False
    assert row["score_total"] is not None
