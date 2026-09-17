from convergeo_engine.auth_jwt import assert_posse_anunciante
from convergeo_engine.store import MemoryStore, reset_store
import pytest
from fastapi import HTTPException


def test_posse_cruzada_403():
    reset_store()
    ctx = {"perfil": {"papel": "corretor", "anunciante_id": "aaa"}}
    with pytest.raises(HTTPException) as exc:
        assert_posse_anunciante(ctx, "bbb")
    assert exc.value.status_code == 403


def test_admin_pode_tudo():
    assert_posse_anunciante({"perfil": {"papel": "admin"}}, "qualquer")
