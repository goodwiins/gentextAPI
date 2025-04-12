from nltk.tokenize import sent_tokenize
import random


def tokenize_sentences(text):
    sentences = [sent_tokenize(text)]
    sentences = [y for x in sentences for y in x]
    sentences = [sentence.strip() for sentence in sentences if len(sentence) > 20]
    return sentences



def beam_search_decoding(inp_ids, attn_mask, model, tokenizer):
    beam_output = model.generate(input_ids=inp_ids,
                                 attention_mask=attn_mask,
                                 max_length=256,
                                 num_beams=10,
                                 num_return_sequences=3,
                                 no_repeat_ngram_size=2,
                                 early_stopping=True
                                 )
    Questions = [tokenizer.decode(out, skip_special_tokens=True, clean_up_tokenization_spaces=True) for out in
                 beam_output]
    return [Question.strip().capitalize() for Question in Questions]
def greedy_decoding (inp_ids,attn_mask,model,tokenizer):
    greedy_output = model.generate(input_ids=inp_ids, attention_mask=attn_mask, max_length=256)
    Question =  tokenizer.decode(greedy_output[0], skip_special_tokens=True,clean_up_tokenization_spaces=True)
    return Question.strip().capitalize()
