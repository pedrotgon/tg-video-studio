from novelvideo.api.routes.ingest import (
    _commercial_br_error,
    _file_too_large_response,
    _text_too_large_response,
    _unsupported_format_response,
)


COMMERCIAL = {"content_profile": "commercial_br"}


def test_commercial_upload_errors_are_pt_br() -> None:
    errors = [
        _unsupported_format_response("briefing.exe", COMMERCIAL)["error"],
        _file_too_large_response(project_config=COMMERCIAL)["error"],
        _text_too_large_response(999_999, COMMERCIAL)["error"],
        _commercial_br_error("解析章节失败: 文件编码不支持", COMMERCIAL),
        _commercial_br_error("非法文件名", COMMERCIAL),
        _commercial_br_error("无法读取上传文件，请重新上传后再导入", COMMERCIAL),
    ]

    assert all(
        not any("\u3400" <= char <= "\u9fff" for char in error) for error in errors
    )
    assert errors[0].startswith("Tipo de arquivo não suportado")
    assert "limite" in errors[1]
    assert "caracteres" in errors[2]


def test_legacy_project_error_contract_remains_unchanged() -> None:
    message = "解析章节失败: 文件编码不支持"
    assert _commercial_br_error(message, {}) == message
