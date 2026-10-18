import numpy as np

from ai.heart_sound_analysis.quality import assess_recording


def test_short_or_silent_recording_is_not_diagnostic():
    result = assess_recording(np.zeros(8000), 16000)
    assert not result.usable
    assert result.diagnostic_inference_available is False
    assert any("shorter" in issue or "no measurable" in issue for issue in result.issues)


def test_valid_recording_is_only_ingestion_quality():
    result = assess_recording(np.ones(16000 * 5) * 0.1, 16000)
    assert result.usable
    assert result.diagnostic_inference_available is False
