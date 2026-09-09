import pytest
from pydantic import ValidationError
from novelvideo.api.routes.client_profile import CopyInput
from novelvideo.client_profile import ProfileStore

def test_review_fields_survive_versioned_storage(tmp_path):
    store = ProfileStore(tmp_path)
    original = store.save('copy', 'test', {'title': 'Teste', 'text': 'Fala original', 'status': 'draft', 'source_post_id': 'reference'})
    for status in ('adjusted', 'approved', 'recorded', 'published', 'rejected'):
        update = CopyInput(title='Teste', text='Fala revisada', status=status, version=original['version'], review_note='Decisão da equipe', performance_note='Sem dados de venda', caption='Legenda', hook_visual='Direção')
        original = store.save('copy', 'test', {**original, **update.model_dump(exclude_unset=True)}, update.version)
        assert store.get('copy', 'test')['source_post_id'] == 'reference'
        assert store.get('copy', 'test')['status'] == status
        assert store.get('copy', 'test')['review_note'] == 'Decisão da equipe'

def test_legacy_update_preserves_omitted_fields():
    update = CopyInput(title='Teste', text='Fala', status='approved', version=1)
    assert 'caption' not in update.model_dump(exclude_unset=True)
    with pytest.raises(ValidationError):
        CopyInput(title='Teste', text='Fala', status='invalid', version=1)
