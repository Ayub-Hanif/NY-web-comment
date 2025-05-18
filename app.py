# Author: Mohammad Ayub Hanif Saleh 
#         Raiyan Sazid 

from flask import Flask, jsonify, redirect, render_template, send_from_directory, session, request
from authlib.integrations.flask_client import OAuth
from authlib.common.security import generate_token
from pymongo import MongoClient
from bson import ObjectId
from datetime import datetime
import os
import requests
from flask_cors import CORS

# we need to load the .env rather than I think typing it in the terminal, this way both of us can use it.
# without having to type it in the terminal just make a .env file and add your api key there.
from dotenv import load_dotenv, find_dotenv
load_dotenv(find_dotenv())

static_path = os.getenv('STATIC_PATH','static')
template_path = os.getenv('TEMPLATE_PATH','templates')

app = Flask(__name__, static_folder=static_path, template_folder=template_path)
app.secret_key = os.urandom(24)
CORS(app)

mongoClient = MongoClient(os.getenv('MONGO_URI'))
db = mongoClient.mydatabase


oauth = OAuth(app)

nonce = generate_token()

NYT_KEY = os.getenv("NYT_API_KEY")


oauth.register(
    name=os.getenv('OIDC_CLIENT_NAME'),
    client_id=os.getenv('OIDC_CLIENT_ID'),
    client_secret=os.getenv('OIDC_CLIENT_SECRET'),
    #server_metadata_url='http://dex:5556/.well-known/openid-configuration',
    authorization_endpoint="http://localhost:5556/auth",
    token_endpoint="http://dex:5556/token",
    jwks_uri="http://dex:5556/keys",
    userinfo_endpoint="http://dex:5556/userinfo",
    device_authorization_endpoint="http://dex:5556/device/code",
    client_kwargs={'scope': 'openid email profile'}
)

@app.route('/')
@app.route('/<path:path>')
def serve_frontend(path=''):
    if path != '' and os.path.exists(os.path.join(static_path,path)):
        return send_from_directory(static_path, path)
    return render_template('index.html', user=session.get('user'))

@app.route('/api/key')
def get_key():
    return jsonify({'apiKey': os.getenv('NYT_API_KEY')})

@app.route('/api/findArticle/<string:location1>-<string:location2>/<string:date>')
def findArticle(location1, location2, date):
    pageSize = request.args.get('pageSize', default=10, type=int) #we need the pageSize and page to get page data not only the first page.
    page = request.args.get('page', default=0, type=int) #we can increment using the page number to get more data.
    par = {
        'end_date': date,
        'fq': 'timesTag.location.contains:' + location1 + ' OR timesTag.location.contains:' + location2,
        'sort': 'newest',
        'api-key': NYT_KEY,
        'page': page,
        'pageSize': pageSize,
    }
    url = 'https://api.nytimes.com/svc/search/v2/articlesearch.json'
    response = requests.get(url, params=par, timeout=10)
    if response.status_code == 200:
        #added the lazy loading but for that to happen we need to add the pageSize and page to the api call.
        # this way we can get more data but in small bits and more once we hit the footer.
        new_data = response.json()
        # we get the response and then we get the docs from raw data we got. Also check if its empty or not.
        get_doc = new_data.get('response', {}).get('docs') or []
        new_data['response']['docs'] = get_doc[:pageSize]
        return jsonify(new_data)
    else:
        return jsonify({'error': 'Failed to fetch data from NYT API'}), 500

@app.route('/login')
def login():
    session['nonce'] = nonce
    redirect_uri = 'http://localhost:8000/authorize'
    return oauth.flask_app.authorize_redirect(redirect_uri, nonce=nonce)

@app.route('/authorize')
def authorize():
    token = oauth.flask_app.authorize_access_token()
    nonce = session.get('nonce')

    user_info = oauth.flask_app.parse_id_token(token, nonce=nonce)  # or use .get('userinfo').json()
    session['user'] = user_info
    return redirect('/')

@app.route('/logout')
def logout():
    session.clear()
    return redirect('/')

# Get user comments for a specific article using article title
@app.route('/api/comments/<string:article_title>', methods=['GET'])
def get_comments(article_title):
    '''Get comments for a specific article title from the database.'''
    print("Printing the DB\n\n\n\n\n\n\n\n")
    print(db)

    # if no comments collection create new one
    if 'comments' not in db.list_collection_names():
        db.create_collection('comments')

    comments = list(db.comments.find({'articleTitle': article_title}))

    return jsonify(comments)

# Post a comment on a specific article
@app.route('/api/comments', methods=['POST'])
def post_comment():
    user = session.get('user')
    data = request.json

    print(data)

    comment = {
        'articleTitle': data['articleTitle'],
        'text': data['text'],
        'user': user['email'] if user else 'Guest',
        'username': user['name'] if user else 'Anonymous',
        'date': datetime.now(),
        'replies': [],
        '_id': str(ObjectId()),
    }

    result = db.comments.insert_one(comment)
    return jsonify(comment), 201

# Post a reply to a specific comment
@app.route('/api/comments/<string:comment_id>/reply', methods=['POST'])
def post_reply(comment_id):
    user = session.get('user')
    data = request.json

    reply = {
        'text': data['text'],
        'user': user['email'] if user else 'Guest',
        'username': user['name'] if user else 'Anonymous',
        'date': datetime.now(),
    }

    result = db.comments.update_one(
        {'_id': comment_id},
        {'$push': {'replies': reply}}
    )

    return jsonify(reply), 201



if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=8000)
