# SPDX-License-Identifier: Elastic-2.0
# Copyright (c) 2026 TG
import httpx
import pytest
from novelvideo import profile_provider as provider


def response(text='{"questions": []}', reason="STOP"):
    return {"candidates": [{"finishReason": reason, "content": {"parts": [{"text": text}]}}]}


def install(monkeypatch, handler):
    original = httpx.AsyncClient
    monkeypatch.setattr(provider, "credentials", lambda _: ("test-not-a-key", "gemini-3.7-flash"))
    monkeypatch.setattr(provider.httpx, "AsyncClient", lambda **kw: original(transport=httpx.MockTransport(handler), **kw))


async def test_transient_error_uses_alternate_and_reports_real_model(monkeypatch):
    paths = []
    def handler(request):
        paths.append(request.url.path)
        return httpx.Response(503 if len(paths) == 1 else 200, json=response())
    install(monkeypatch, handler)
    model, text = await provider.generate_fast_text("p", "copy")
    assert model == provider.FAST_MODELS[1]
    assert len(paths) == 2 and text == '{"questions": []}'


@pytest.mark.parametrize("code", [401, 403])
async def test_auth_errors_do_not_trigger_fallback(monkeypatch, code):
    calls = []
    def handler(request):
        calls.append(request)
        return httpx.Response(code)
    install(monkeypatch, handler)
    with pytest.raises(ValueError, match="autorização"):
        await provider.generate_fast_text("p", "copy")
    assert len(calls) == 1


async def test_safety_block_does_not_trigger_fallback(monkeypatch):
    calls = []
    def handler(request):
        calls.append(request)
        return httpx.Response(200, json=response("", "SAFETY"))
    install(monkeypatch, handler)
    with pytest.raises(ValueError, match="bloqueou"):
        await provider.generate_fast_text("p", "copy")
    assert len(calls) == 1


async def test_invalid_json_can_use_alternate(monkeypatch):
    calls = []
    def handler(request):
        calls.append(request)
        return httpx.Response(200, json=response("invalid" if len(calls) == 1 else '{"ok": true}'))
    install(monkeypatch, handler)
    model, _ = await provider.generate_fast_text("p", "copy")
    assert model == provider.FAST_MODELS[1]


async def test_timeout_is_bounded_and_no_fake_result(monkeypatch):
    calls = []
    def handler(request):
        calls.append(request)
        raise httpx.ReadTimeout("timeout", request=request)
    install(monkeypatch, handler)
    with pytest.raises(ValueError, match="tempo de resposta"):
        await provider.generate_fast_text("p", "copy")
    assert len(calls) == 2


async def test_high_is_primary_and_lite_only_fallback(monkeypatch):
    import json
    calls = []
    def handler(request):
        calls.append((request.url.path, json.loads(request.content)))
        return httpx.Response(503 if len(calls) == 1 else 200, json=response())
    install(monkeypatch, handler)
    model, _ = await provider.generate_fast_text("p", "copy", prefer_high=True)
    assert "gemini-3.7-flash" in calls[0][0]
    assert calls[0][1]["generationConfig"]["thinkingConfig"] == {"thinkingLevel": "high"}
    assert model == "gemini-3.1-flash-lite"


def test_quarantined_text_never_reaches_generation_context():
    value = {"caption": "emagrecer rápido", "quarantined_sensitive_blocks": [{"literal_text": "segredo"}], "blocks": [{"text": "retido", "policy_status": "blocked_from_generator"}, {"text": "convite"}]}
    clean = provider.generation_context(value)
    assert "quarantined_sensitive_blocks" not in clean
    assert "emagrecer rápido" not in clean["caption"]
    assert clean["blocks"] == [{"text": "convite"}]
