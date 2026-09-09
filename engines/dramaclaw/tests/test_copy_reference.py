from novelvideo.copy_reference import published_copy_reference


def test_music_does_not_become_spoken_copy():
    post = {"id": "a", "caption": "Texto publicado", "version": 3}
    result = published_copy_reference(post, [{"post_id": "a", "status": "passed", "audio_status": "present_music_only", "transcript_literal": "música"}])
    assert result["caption"] == "Texto publicado"
    assert result["spoken_transcript"] is None
    assert result["commercial_validation"] == "not_established_by_publication"


def test_reference_preserves_source_and_excludes_other_post():
    post = {"id": "a", "caption": "Legenda", "version": 2}
    records = [{"post_id": "b", "status": "passed", "audio_status": "present_speech", "transcript_literal": "Outro cliente"}, {"post_id": "a", "status": "passed", "audio_status": "present_speech", "transcript_literal": "Fala original", "version": 4}]
    result = published_copy_reference(post, records)
    assert result["spoken_transcript"] == "Fala original"
    assert result["transcript_version"] == 4
    assert "Outro cliente" not in str(result)


def test_blocked_transcript_cannot_supply_speech():
    result = published_copy_reference({"id": "a"}, [{"post_id": "a", "status": "blocked_no_audio", "audio_status": "present_speech", "transcript_literal": "SEM ÁUDIO"}])
    assert result["spoken_transcript"] is None
