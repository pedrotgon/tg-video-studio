import os
import tempfile
import unittest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from server.tg_projects import router


class ProjectTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.old = os.environ.get('TG_DATA_DIR')
        os.environ['TG_DATA_DIR'] = self.temp.name
        app = FastAPI()
        app.include_router(router)
        self.client = TestClient(app)
        self.base = '/api/tg/projects'
        self.p = self.client.post(self.base, json={'title': 'Teste', 'client': 'Marca A'}).json()['id']
        self.other = self.client.post(self.base, json={'title': 'Outro'}).json()['id']
        self.c = self.client.post(f'{self.base}/{self.p}/creatives', json={'title': 'Cena'}).json()['id']
        self.path = f'{self.base}/{self.p}/creatives/{self.c}'

    def tearDown(self):
        self.client.close()
        if self.old is None:
            os.environ.pop('TG_DATA_DIR', None)
        else:
            os.environ['TG_DATA_DIR'] = self.old
        self.temp.cleanup()

    def test_isolation_and_revision_conflict(self):
        state = {'version': 1, 'title': 'Cena final', 'frames': [], 'scene': {'actors': []}}
        self.assertEqual(self.client.get(f'{self.base}/{self.other}/creatives/{self.c}').status_code, 404)
        saved = self.client.put(self.path, json={'revision': 0, 'sequence': state})
        self.assertEqual(saved.json()['revision'], 1)
        self.assertEqual(self.client.put(self.path, json={'revision': 0, 'sequence': state}).status_code, 409)
        self.assertEqual(self.client.get(self.path).json()['sequence'], state)
        self.assertEqual(self.client.get(f'{self.base}/{self.other}/creatives').json(), [])

    def test_elements_are_reusable_only_in_their_project(self):
        state = {'version': 1, 'title': 'Cena', 'frames': [], 'scene': {'actors': [{'name': 'Coelho'}]}, 'backdrop': '', 'background': '#ffffff', 'audio': '', 'audioName': ''}
        self.client.put(self.path, json={'revision': 0, 'sequence': state})
        self.assertEqual(self.client.post(f'{self.path}/elements').status_code, 200)
        next_id = self.client.post(f'{self.base}/{self.p}/creatives', json={'title': 'Nova cena'}).json()['id']
        self.assertEqual(self.client.get(f'{self.base}/{self.p}/creatives/{next_id}').json()['library']['actors'], state['scene']['actors'])
        other_id = self.client.post(f'{self.base}/{self.other}/creatives', json={'title': 'Outra cena'}).json()['id']
        self.assertIsNone(self.client.get(f'{self.base}/{self.other}/creatives/{other_id}').json()['library'])

    def test_export_file_history_and_scope(self):
        blob = b'GIF89a-test'
        result = self.client.post(f'{self.path}/exports/gif', content=blob)
        self.assertEqual(result.status_code, 201)
        export_id = result.json()['id']
        self.assertEqual(self.client.get(f'{self.path}/exports/{export_id}').content, blob)
        self.assertEqual(len(self.client.get(f'{self.path}/exports').json()), 1)
        self.assertEqual(self.client.get(f'{self.base}/{self.other}/creatives/{self.c}/exports/{export_id}').status_code, 404)
        self.assertEqual(self.client.post(f'{self.path}/exports/mp4', content=blob).status_code, 422)
        self.assertEqual(self.client.post(f'{self.path}/exports/gif', content=b'').status_code, 422)


if __name__ == '__main__':
    unittest.main()
