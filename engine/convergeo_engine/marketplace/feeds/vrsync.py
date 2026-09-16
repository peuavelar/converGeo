"""Parser VRSync (Grupo Zap / VivaReal). Schema: http://www.vivareal.com/schemas/1.0/VRSync"""

from __future__ import annotations

import xml.etree.ElementTree as ET
from typing import Any

NS = {"vr": "http://www.vivareal.com/schemas/1.0/VRSync"}

# Documentação: https://developers.grupozap.com/feeds/vrsync/elements/listing.html
TRANSACTION = {
    "For Sale": "venda",
    "For Rent": "aluguel",
    "Sale/Rent": "venda",
}

PROPERTY = {
    "Residential / Apartment": "apartamento",
    "Residential / Home": "casa",
    "Residential / Condo": "casa",
    "Residential / Studio": "studio",
    "Commercial / Office": "sala",
    "Commercial / Land Lot": "terreno",
    "Residential / Land Lot": "terreno",
}


def _text(el: ET.Element | None) -> str | None:
    if el is None or el.text is None:
        return None
    return el.text.strip() or None


def _find(parent: ET.Element, path: str) -> ET.Element | None:
    hit = parent.find(path, NS)
    if hit is not None:
        return hit
    return parent.find(path.replace("vr:", ""))


def parse_vrsync(xml_bytes: bytes) -> list[dict[str, Any]]:
    root = ET.fromstring(xml_bytes)
    listings = root.findall(".//{http://www.vivareal.com/schemas/1.0/VRSync}Listing")
    if not listings:
        listings = root.findall(".//Listing")
    out: list[dict[str, Any]] = []
    for listing in listings:
        details = _find(listing, "vr:Details")
        if details is None:
            details = listing
        location = _find(listing, "vr:Location")
        if location is None:
            location = listing
        tx = _text(_find(listing, "vr:TransactionType")) or "For Sale"
        ptype = _text(_find(details, "vr:PropertyType")) or "Residential / Apartment"
        list_price = _text(_find(details, "vr:ListPrice"))
        rent_price = _text(_find(details, "vr:RentalPrice"))
        purpose = TRANSACTION.get(tx, "venda")
        price_raw = rent_price if purpose == "aluguel" and rent_price else list_price
        living = _text(_find(details, "vr:LivingArea")) or _text(_find(details, "vr:UsableArea"))
        photos = [
            (item.text or "").strip()
            for item in listing.findall(".//{http://www.vivareal.com/schemas/1.0/VRSync}Item")
            if (item.get("medium") or "image") == "image" and item.text
        ]
        if not photos:
            photos = [
                (item.text or "").strip()
                for item in listing.findall(".//Item")
                if item.text
            ]
        display = (location.get("displayAddress") if location is not None else None) or ""
        ocultar = display in {"Neighborhood", "Street"}
        out.append(
            {
                "id_externo": _text(_find(listing, "vr:ListingID")) or _text(listing.find("ListingID")),
                "titulo": _text(_find(listing, "vr:Title")),
                "finalidade": purpose,
                "tipo": PROPERTY.get(ptype, "apartamento"),
                "preco": float(price_raw) if price_raw else None,
                "condominio": _float(_text(_find(details, "vr:PropertyAdministrationFee"))),
                "iptu": _float(_text(_find(details, "vr:Iptu"))),
                "area_util": _float(living),
                "quartos": _int(_text(_find(details, "vr:Bedrooms"))),
                "banheiros": _int(_text(_find(details, "vr:Bathrooms"))),
                "vagas": _int(_text(_find(details, "vr:Garage"))),
                "ano_construcao": _int(_text(_find(details, "vr:YearBuilt"))),
                "endereco_logradouro": _text(_find(location, "vr:Address")),
                "endereco_bairro": _text(_find(location, "vr:Neighborhood")),
                "endereco_cidade": _text(_find(location, "vr:City")),
                "cep": _text(_find(location, "vr:PostalCode")),
                "lat": _float(_find_attr(location, "vr:Latitude") if location is not None else None),
                "lng": _float(_find_attr(location, "vr:Longitude") if location is not None else None),
                "descricao": _text(_find(details, "vr:Description")),
                "fotos": photos,
                "ocultar_endereco": ocultar,
            }
        )
    return out


def _find_attr(el: ET.Element | None, tag: str) -> str | None:
    if el is None:
        return None
    child = el.find(tag, NS)
    if child is None:
        child = el.find(tag.replace("vr:", ""))
    return _text(child)


def _float(v: str | None) -> float | None:
    if v is None:
        return None
    try:
        return float(v.replace(",", "."))
    except ValueError:
        return None


def _int(v: str | None) -> int | None:
    if v is None:
        return None
    try:
        return int(float(v))
    except ValueError:
        return None
