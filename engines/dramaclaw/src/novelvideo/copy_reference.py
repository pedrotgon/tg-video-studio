"""Build generation evidence from source records, never from paraphrased blocks."""


def published_copy_reference(post: dict, transcripts: list[dict]) -> dict:
    transcript = next((t for t in transcripts if t.get("post_id") == post["id"]), {})
    spoken = (
        transcript.get("status") == "passed"
        and transcript.get("audio_status") == "present_speech"
        and bool(str(transcript.get("transcript_literal") or "").strip())
    )
    return {
        "post_id": post["id"],
        "post_version": post.get("version"),
        "source_url": post.get("source_url"),
        "caption": post.get("caption") or "",
        "spoken_transcript": transcript.get("transcript_literal") if spoken else None,
        "transcript_version": transcript.get("version") if spoken else None,
        "reference_status": "published_reference_in_local_archive",
        "commercial_validation": "not_established_by_publication",
        "instructions_for_interpretation": "Caption is not speech. Use structure, not unverified health promises. Existing derived blocks are excluded.",
    }
