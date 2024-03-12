import numpy as np

import time
from transformers import T5Tokenizer, T5ForConditionalGeneration
import torch
import random
from helpers.helpers import tokenize_sentences, beam_search_decoding
from pprint import pprint
import nltk


class Bool_Q:
    def __init__(self):
        self.tokenizer = T5Tokenizer.from_pretrained('t5-base')
        model = T5ForConditionalGeneration.from_pretrained('ramsrigouthamg/t5_boolean_questions')
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        model.to(device)
        self.device = device
        self.model = model
        self.set_seed(42)

    def set_seed(self, seed):
        np.random.seed(seed)
        torch.manual_seed(seed)
        if torch.cuda.is_available():
            torch.cuda.manual_seed(seed)

    def random_choice(self):
        a = random.choice([0, 1])
        return bool(a)
        
    def predict_boolq(self, payload, num):

        start = time.time()

        inp = {
            "input_text": payload.get("input_text"),
            "max_questions": payload.get("max_questions", num)
        }
        # assign the value into dicttokenize_sentences
        text = inp['input_text']
        num = inp['max_questions']
        sentences = tokenize_sentences(text)
        # calling the tokenize_sentences to tokenizing the text
        joiner = " "
        modified_text = joiner.join(sentences)
        answer = self.random_choice()
        form = "truefalse: %s passage: %s </s>" % (modified_text, answer)
        # create the encoder feeded by the text, setting the return_tensors as torch
        encoding = self.tokenizer.encode_plus(form, return_tensors="pt")
        input_ids, attention_masks = encoding["input_ids"].to(self.device), encoding["attention_mask"].to(self.device)
        output = beam_search_decoding(input_ids, attention_masks, self.model, self.tokenizer)
        if torch.device == 'cuda':
            torch.cuda.empty_cache()
        # store the text and the number of the possible question that the model has predicted
        final = {}
        final['Text'] = text
        final['Count'] = num
        final['Boolean Questions'] = output
        return final
class Answer_Predict:
    def __init__(self):
        self.tokenizer = T5Tokenizer.from_pretrained('t5-base')
        model = T5ForConditionalGeneration.from_pretrained('Parth/boolean')
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        model.to(device)
        # model.eval()
        self.device = device
        self.model = model
        self.set_seed(42)
    def set_seed(self,seed):
        np.random.seed(seed)
        torch.manual_seed(seed)
        if torch.cuda.is_available():
            torch.cude.manual_seed_all(seed)
    def predict_answer(self,payload):
        inp = {
            "input_text": payload.get("input_text"),
            "input_question" : payload.get("input_question")
        }
        context = inp["input_text"]
        question = inp["input_question"]
        input = "question: %s <s> context: %s </s>" % (question,context)
        encoding = self.tokenizer.encode_plus(input, return_tensors="pt")
        input_ids, attention_masks = encoding["input_ids"].to(self.device), encoding["attention_mask"].to(self.device)
        greedy_output = self.model.generate(input_ids=input_ids, attention_mask=attention_masks, max_length=256)
        Question =  self.tokenizer.decode(greedy_output[0], skip_special_tokens=True,clean_up_tokenization_spaces=True)
        output = Question.strip().capitalize()
        return output
answer = Answer_Predict()
payload4 = {
    "input_text" : '''Sachin Ramesh Tendulkar is a former international cricketer from 
              India and a former captain of the Indian national team. He is widely regarded 
              as one of the greatest batsmen in the history of cricket. He is the highest
               run scorer of all time in International cricket.''',
    "input_question" : "Is Sachin tendulkar  a former cricketer? "
}
output = answer.predict_answer(payload4)
print(output)














answer = Bool_Q()
textInput = '''
Albert Einstein (/ˈaɪnstaɪn/ EYEN-styne;[4] German: [ˈalbɛʁt ˈʔaɪnʃtaɪn] (About this soundlisten); 14 March 1879 – 18 April 1955) was a German-born theoretical physicist[5] who developed the theory of relativity, one of the two pillars of modern physics (alongside quantum mechanics).[3][6] His work is also known for its influence on the philosophy of science.[7][8] He is best known to the general public for his mass–energy equivalence formula E = mc2, which has been dubbed "the world's most famous equation".[9] He received the 1921 Nobel Prize in Physics "for his services to theoretical physics, and especially for his discovery of the law of the photoelectric effect",[10] a pivotal step in the development of quantum theory.

The son of a salesman who later operated an electrochemical factory, Einstein was born in the German Empire, but moved to Switzerland in 1895, forsaking his German citizenship the following year. Specializing in physics and mathematics, he received his academic teaching diploma from the Swiss Federal Polytechnic School in Zürich in 1900. The following year, he acquired Swiss citizenship, which he kept for his entire life. After initially struggling to find work, from 1902 to 1909 he was employed as a patent examiner at the Swiss Patent Office in Bern.

Near the beginning of his career, Einstein thought that the laws of classical mechanics could no longer be reconciled with those of the electromagnetic field. This led him to develop his special theory of relativity during his time as a patent clerk. In 1905, called his annus mirabilis ('miracle year'), he published four groundbreaking papers which attracted the attention of the academic world; the first paper outlined the theory of the photoelectric effect, the second explained Brownian motion, the third introduced special relativity, and the fourth mass–energy equivalence. That year, at the age of 26, he was awarded a PhD by the University of Zurich.
'''

payload = {
    "input_text": textInput

}
num = input('how many questions you wanted to be generated? \n')
output = answer.predict_boolq(payload,num)

output['Boolean Questions']