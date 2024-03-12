from flask import request, jsonify, render_template
from . import routes
import services.test as svc
import json

@routes.route('/tests')
def tests():
    return svc.test_test()


@routes.route("/len_text", methods=['POST'])
def len_text():
    body = request.json
    length = svc.len_of_text(body["text"])
    return jsonify({"response":length})

@routes.route('/data', methods=['GET', 'POST'])
def index():
    if request.method == 'POST':
        submitted_text = request.form['text']
        result = svc.nlp_test(submitted_text)
        resultJson = { 
                "response":result
    }
        return render_template('index.html', result=resultJson)
    return render_template('index.html')
    
    # data = "/Users/goodwiinz/Documents/genTextAPI/services/True_Flase_gen/text.txt"
    # with open(data, 'r') as f:
    #     contents = f.read()
    # result = svc.nlp_test(contents)
    # return {
    #     "text":contents,
    #     "response":result
    # }
    

  





