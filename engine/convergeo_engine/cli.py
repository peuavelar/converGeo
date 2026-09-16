from __future__ import annotations

import argparse
import json
from pathlib import Path

from convergeo_engine.api.app import migrate
from convergeo_engine.config import ENGINE_ROOT, get_settings
from convergeo_engine.etl import run_all
from convergeo_engine.etl.cnpj import run_cnpj
from convergeo_engine.etl.grade import run_grade
from convergeo_engine.etl.ibge import run_ibge
from convergeo_engine.etl.osm import run_osm
from convergeo_engine.marketplace.aggregate import aggregate
from convergeo_engine.marketplace.ingest import ingest_csv, ingest_vrsync
from convergeo_engine.scoring.compute import compute_scores_v2
from convergeo_engine.store import get_store


def write_fase1_report(payload: dict) -> Path:
    path = ENGINE_ROOT / "reports" / "fase1_qualidade.md"
    path.parent.mkdir(parents=True, exist_ok=True)
    grade = payload.get("grade") or {}
    cnpj = payload.get("cnpj") or {}
    ibge = payload.get("ibge") or {}
    osm = payload.get("osm") or {}
    path.write_text(
        "\n".join(
            [
                "# Fase 1 — qualidade",
                "",
                f"- Hexágonos mascarados: **{grade.get('hexagonos', 'n/d')}**",
                f"- Municípios: {grade.get('municipios', [])}",
                f"- Resolução H3: {grade.get('resolucao', 8)}",
                f"- Hexágonos com renda: {ibge.get('com_renda', 'n/d')} / {ibge.get('hexagonos_demograficos', 'n/d')}",
                f"- Empresas geocodificadas: {cnpj.get('empresas_geocodificadas', 'n/d')}",
                f"- Hexágonos distintos com empresas: {cnpj.get('hexagonos_com_empresas', 'n/d')}",
                f"- geo_precisao: {cnpj.get('geo_precisao', {})}",
                f"- POIs OSM: {osm.get('pois', 'n/d')} {osm.get('por_categoria', {})}",
                "",
                "Números do pitch (1.077 hexágonos) devem ser substituídos pelo valor real acima após `etl all` com a malha IBGE oficial.",
                "",
            ]
        ),
        encoding="utf-8",
    )
    return path


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="convergeo-engine")
    sub = parser.add_subparsers(dest="cmd", required=True)

    sub.add_parser("migrate")
    etl = sub.add_parser("etl")
    etl.add_argument("step", choices=["grade", "ibge", "cnpj", "osm", "all"])
    mkt = sub.add_parser("marketplace")
    mkt.add_argument("step", choices=["aggregate", "sync-feeds", "ingest-csv"])
    mkt.add_argument("--file", default="")
    mkt.add_argument("--anunciante", default="seed")
    scoring = sub.add_parser("scoring")
    scoring.add_argument("step", choices=["compute", "validate"])
    sub.add_parser("serve")

    args = parser.parse_args(argv)
    store = get_store()

    if args.cmd == "migrate":
        print(json.dumps(migrate(), ensure_ascii=False))
        return 0
    if args.cmd == "etl":
        fn = {"grade": run_grade, "ibge": run_ibge, "cnpj": run_cnpj, "osm": run_osm, "all": run_all}[
            args.step
        ]
        result = fn(store)
        if args.step == "all":
            write_fase1_report(result)
        print(json.dumps(result, ensure_ascii=False, default=str))
        return 0
    if args.cmd == "marketplace":
        if args.step == "aggregate":
            print(json.dumps({"precos_hex": len(aggregate(store))}))
            return 0
        if args.step == "ingest-csv":
            content = Path(args.file).read_text(encoding="utf-8")
            print(json.dumps(ingest_csv(args.anunciante, content, store), default=str))
            return 0
        if args.step == "sync-feeds":
            an = next((a for a in store.anunciantes if a["id"] == args.anunciante), None)
            if not an or not an.get("feed_bytes"):
                print(json.dumps({"error": "feed não encontrado"}))
                return 1
            print(json.dumps(ingest_vrsync(args.anunciante, an["feed_bytes"], store), default=str))
            return 0
    if args.cmd == "scoring":
        if args.step == "compute":
            n = compute_scores_v2(store, bairro_weight=get_settings().bairro_geo_weight)
            print(json.dumps({"scores_imobiliario": n}))
            return 0
        path = ENGINE_ROOT / "reports" / "validacao_score.md"
        path.parent.mkdir(parents=True, exist_ok=True)
        n = len(store.scores_imobiliario)
        pairs = []
        px = {p["h3_index"]: p.get("mediana_m2") for p in store.precos_hex}
        for s in store.scores_imobiliario:
            m = px.get(s["h3_index"])
            if s.get("score_total") is not None and m is not None:
                pairs.append((float(s["score_total"]), float(m)))
        if len(pairs) < 8:
            path.write_text(
                f"# Validação score v2\n\nAmostra n={len(pairs)} (scores={n}). "
                "Insuficiente para Pearson/Spearman vs mediana_m2 — rode ETL + aggregate + scoring compute com base real.\n",
                encoding="utf-8",
            )
        else:
            xs, ys = zip(*pairs)
            path.write_text(
                f"# Validação score v2\n\nn={len(pairs)}\n\n"
                "Correlação: rode estatística local (scipy) sobre pares score_total × mediana_m2 gravados no store.\n"
                f"Média score={sum(xs)/len(xs):.3f}; média m2={sum(ys)/len(ys):.1f}.\n",
                encoding="utf-8",
            )
        print(path)
        return 0
    if args.cmd == "serve":
        import uvicorn

        uvicorn.run("convergeo_engine.api.app:app", host="0.0.0.0", port=8000, reload=False)
        return 0
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
