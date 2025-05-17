# Author: Mohammad Ayub Hanif Saleh 
#         Raiyan Sazid 

import os
import unittest
import unittest.mock as mock

from app import app

# This class is used to test the flask application and its endpoints. as well as the api and article fetch.
class BackendTestCase(unittest.TestCase):
    # just setting up the test and environment.
    def setUp(self):
        os.environ['NYT_API_KEY'] = 'tempnoreal2983482783432key'
        self.client = app.test_client()

    # we are using mock to check if the api key we are getting it correctly from the env.
    def test_APIKey(self):
        "\nTest#1 which should GET /api/key and return it from .env\n"
        response = self.client.get('/api/key')
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertIn('apiKey', data)
        self.assertEqual(data['apiKey'], 'tempnoreal2983482783432key')

    # we are mocking to check if the request is being made and the response is being returned correctly.
    @mock.patch('app.requests.get')
    def test_findArticle(self, mockGet):
        "Test#2 which should GET /api/findArticle/<loc1>-<loc2>/<date> and pageSize add it to the docs \n"
        tempDocs = [{'id': i} for i in range(3)]
        mockJson = {'response': {'docs': tempDocs}}
        mockResponse = mock.MagicMock(status_code=200)
        mockResponse.json.return_value = mockJson
        mockGet.return_value = mockResponse
        Response = self.client.get(
            '/api/findArticle/Sacramento-and-Davis/20250101?pageSize=2&page=0'
        )
        self.assertEqual(Response.status_code, 200)

        data = Response.get_json()
        self.assertEqual(len(data['response']['docs']), 2)
        _, kwargs = mockGet.call_args
        params = kwargs['params']
        self.assertEqual(params['page'], 0)
        self.assertEqual(params['pageSize'], 2) 
        self.assertIn('Sacramento', params['fq'])
        self.assertIn('Davis', params['fq'])
    
    # the mock of fail request to check if the api is returning a correct error message.
    @mock.patch('app.requests.get')
    def test_findArticleFail(self, mockGet):
        "Test#3 which returns non-ok and our endpoint yields a 500 and an error message"
        mockResponse = mock.MagicMock(status_code=500)
        mockGet.return_value = mockResponse
        Response = self.client.get('/api/findArticle/Sacramento-and-Davis/20250101')
        self.assertEqual(Response.status_code, 500)
        data = Response.get_json()
        self.assertIn('error', data)
        self.assertTrue(data['error'])

if __name__ == '__main__':
    unittest.main()
