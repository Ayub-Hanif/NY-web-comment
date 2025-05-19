#
#  Author: Mohammad Ayub Hanif Saleh 
#         Raiyan Sazid 

import os
import unittest
from unittest import mock

import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

os.environ['FLASK_ENV'] = 'testing'

from app import app, db

# This class is used to test the flask application and its endpoints. as well as the api and article fetch.
class BackendTestCase(unittest.TestCase):
    # just setting up the test and environment.
    def setUp(self):
        os.environ['NYT_API_KEY'] = 'tempnoreal29sdfdsf83482783432key'
        app.config['TESTING'] = True
        self.client = app.test_client()

    # we are using mock to check if the api key we are getting it correctly from the env.
    def test_APIKey(self):
        "\nTest#1 which should GET /api/key and return it from .env\n"
        response = self.client.get('/api/key')

        self.assertEqual(response.status_code, 200)
        data = response.get_json()

        self.assertIn('apiKey', data)

        self.assertEqual(data['apiKey'], 'tempnoreal29sdfdsf83482783432key')

    # we are mocking to check if the request is being made and the response is being returned correctly.
    @mock.patch('app.requests.get')
    def test_findArticle(self, mockGet):
        "Test#2 which should GET /api/findArticle/<loc1>-<loc2>/<date> and pageSize add it to the docs \n"
        tempDocs = [{'id': i} for i in range(5)]
        mock_resp = mock.Mock(status_code=200)
        mock_resp.json.return_value = {'response': {'docs': tempDocs}}
        mockGet.return_value = mock_resp

        response = self.client.get('/api/findArticle/Sacramento-and-Davis/20250101?pageSize=2&page=0')
        self.assertEqual(response.status_code, 200)

        data = response.get_json()

        self.assertEqual(len(data['response']['docs']), 2)
        _, kwargs = mockGet.call_args
        params = kwargs['params']

        self.assertEqual(params['page'], 0)
        self.assertEqual(params['pageSize'], 2)

        self.assertIn('Sacramento', params['fq'])
        self.assertIn('Davis', params['fq'])

    # the mock of fail request to check if the api is returning a correct error message.
    @mock.patch('app.requests.get')
    def testArticle_fail(self, mock_get):
        "Test#3 which returns non-ok and our endpoint yields a 500 and an error message"
        mock_get.return_value = mock.Mock(status_code=500)
        response = self.client.get('/api/findArticle/Sacramento-and-Davis/20250101')
        self.assertEqual(response.status_code, 500)
        data = response.get_json()

        self.assertIn('error', data)

    #we test the collection name and if its created or not and then then it correctly returns empty list if there are not 
    # it will do a 200 which is ok and empty file.
    @mock.patch.object(db, 'list_collection_names', return_value=[])
    @mock.patch.object(db, 'create_collection')
    @mock.patch.object(db.comments, 'find', return_value=[])
    def test_get_comEmpty(self, mock_find, mock_create, mock_list):
        response = self.client.get('/api/comments/No-Article')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json(), [])

        mock_create.assert_called_with('comments')

    # we are checking the find to return a list of comments by doing a post and the api searching the titile and text
    # it should return 201 and the insert_one is called
    @mock.patch.object(db.comments, 'insert_one')
    def test_Pcomment(self, mock_insert):
        pload = {'articleTitle': 'Test', 'text': 'Hello'}
        response = self.client.post('/api/comments', json=pload)

        self.assertEqual(response.status_code, 201)
        data = response.get_json()

        self.assertEqual(data['articleTitle'], 'Test')
        self.assertEqual(data['text'], 'Hello')
        mock_insert.assert_called()

    # we are checking the find the root comment which should match onea and this is done by sending a titile and text
    # again the code 201 is the correct answer here.
    @mock.patch.object(db.comments, 'update_one')
    def test_pReply_root(self, mock_update):
        mock_update.return_value = mock.Mock(matched_count=1)
        pload = {'text': 'Reply'}
        comment_id = 'root123'
        response = self.client.post(f'/api/comments/{comment_id}/reply', json=pload)
        
        self.assertEqual(response.status_code, 201)
        data = response.get_json()

        self.assertEqual(data['text'], 'Reply')
        mock_update.assert_called_with({'_id': comment_id}, {'$push': {'replies': data}})

    #we directly test what if there is no match for the root and then after we a patch to return one of the comments
    # with the empty reply.
    @mock.patch.object(db.comments, 'update_one', return_value=mock.Mock(matched_count=0))
    @mock.patch.object(db.comments, 'find')
    @mock.patch('app.get_comments_and_inserting', return_value=True)
    @mock.patch.object(db.comments, 'replace_one')
    def test_pReply_nested(self, mock_replace, mock_insert_func, mock_find, mock_update):
        # Simulate one comment in DB
        mock_find.return_value = [{'_id': 'parent', 'replies': []}]
        pload = {'text': 'Nested'}
        response = self.client.post('/api/comments/child92348234/reply', json=pload)

        self.assertEqual(response.status_code, 201)
        data = response.get_json()

        self.assertEqual(data['text'], 'Nested')
        mock_replace.assert_called()

    # find to return a list of comments by doing a post and the api searching the titile and text
    # it should return 404 and the insert_one is called (((need to be able  to check for removed)))
    @mock.patch.object(db.comments, 'update_one', return_value=mock.Mock(matched_count=1))
    def test_delRoot_com(self, mock_update):
        # set moderator in session
        with self.client.session_transaction() as sess:
            sess['user'] = {'name': 'moderator'}
        response = self.client.delete('/api/comments/to_delete')

        self.assertEqual(response.status_code, 200)

        self.assertEqual(response.get_json()['status'], 'deleted')

    ##Used some online resources to help me with the testing and mocking. since alot of the unit testing are 
    ##hard to remmber the structure and the key words. Its been a while since I used pytest.
    @mock.patch.object(db.comments, 'update_one', return_value=mock.Mock(matched_count=0))

    @mock.patch.object(db.comments, 'find')

    @mock.patch('app.reply_rem', return_value=True)
    #Deleting the nested reply and also comments replies tree and then marking it removed to see
    #if it always returns 200 if this is broken then we will waste alot of time wondering.
    @mock.patch.object(db.comments, 'replace_one')
    def test_delNested_com(self, mock_replace, mock_reply_rem, mock_find, mock_update):
        with self.client.session_transaction() as sess:
            sess['user'] = {'name': 'moderator'}
        mock_find.return_value = [{'_id': 'root', 'replies': [{'_id': 'child'}]}]
        response = self.client.delete('/api/comments/child')

        self.assertEqual(response.status_code, 200)

        self.assertEqual(response.get_json()['status'], 'deleted')

    @mock.patch.object(db.comments, 'update_one', return_value=mock.Mock(matched_count=0))

    @mock.patch.object(db.comments, 'find', return_value=[])

    #it should always return 404 because we are deleting a commment that does not yet exist.
    def test_delNot_found(self, mock_find, mock_update):
        with self.client.session_transaction() as sess:
            sess['user'] = {'name': 'moderator'}
        response = self.client.delete('/api/comments/non-existent')

        self.assertEqual(response.status_code, 404)

        self.assertIn('error', response.get_json())

    # checking users can't delete comments and replies
    def test_delUnaut(self):
        response = self.client.delete('/api/comments/any')

        self.assertEqual(response.status_code, 400)

        self.assertIn('error', response.get_json())

if __name__ == '__main__':
    unittest.main()
