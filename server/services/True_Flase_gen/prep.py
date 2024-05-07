# import requests
# import json
# import summa.summarizer
# import benepar
# import string
# import nltk
# from nltk import tokenize
# from nltk.tokenize import sent_tokenize
# import re
# from random import shuffle
# import spacy
# import torch
# from nltk import tokenize
# import scipy
# from transformers import GPT2LMHeadModel, GPT2Tokenizer
# from sentence_transformers import SentenceTransformer
# from string import punctuation
#
# benepar_parser = benepar.Parser("benepar_en3")
#
# def run_program(x):
#
#     def read_file(x):
#         content = x
#         return content
#
#     def preprocess(sentences):
#         output = []
#         for sent in sentences:
#             single_quotes_present = len(re.findall(r"['][\w\s.:;,!?\\-]+[']",sent)) > 0
#             double_quotes_present = len(re.findall(r'["][\w\s.:;,!?\\-]+["]',sent)) > 0
#             question_present = "?" in sent
#             if single_quotes_present or double_quotes_present or question_present:
#                 continue
#             else:
#                 output.append(sent.strip(punctuation))
#         return output
#
#     def get_candidate_sents(r_text, ratio=0.3):
#         candidate_sents = summa.summarizer.summarize(r_text, ratio)
#         candidate_sents_list = tokenize.sent_tokenize(candidate_sents)
#         candidate_sents_list = [re.split(r'[:;]+', x)[0] for x in candidate_sents_list]
#         filtered_list_short_sentences = [sent for sent in candidate_sents_list if 30 < len(sent) < 150]
#         return filtered_list_short_sentences
#
#     def get_flattend(t):
#         sent_str_final = None
#         if t is not None:
#             sent_str = [" ".join(x.leaves()) for x in list(t)]
#             sent_str_final = [" ".join(sent_str)]
#             sent_str_final = sent_str_final[0]
#         return sent_str_final
#
#     def get_termination_portion(main_string, sub_string):
#         combined_sub_string = sub_string.replace(" ","")
#         main_string_list = main_string.split()
#         last_index = len(main_string_list)
#         for i in range(last_index):
#             check_string_list = main_string_list[i:]
#             check_string = "".join(check_string_list)
#             check_string = check_string.replace(" ","")
#             if check_string == combined_sub_string:
#                 return " ".join(main_string_list[:i])
#         return None
#
#     def get_right_most_VP_or_NP(parse_tree, last_NP=None, last_VP=None):
#         if len(parse_tree.leaves()) == 1:
#             return get_flattend(last_NP), get_flattend(last_VP)
#         last_subtree = parse_tree[-1]
#         if last_subtree.label() == "NP":
#             last_NP = last_subtree
#         elif last_subtree.label() == "VP":
#             last_vp = last_subtree
#         return get_right_most_VP_or_NP(last_subtree, last_NP, last_VP)
#
#     def get_sentence_completions(key_sentences):
#         sentence_completion_dict = {}
#         for individual_sentence in filter_quotes_and_questions:
#             sentence = individual_sentence.rstrip('?:!.,;')
#             tree = benepar_parser.parse(sentence)
#             last_nounphrase, last_verbphrase =  get_right_most_VP_or_NP(tree)
#             phrases= []
#             if last_verbphrase is not None:
#                 verbphrase_string = get_termination_portion(sentence, last_verbphrase)
#                 phrases.append(verbphrase_string)
#             if last_nounphrase is not None:
#                 nounphrase_string = get_termination_portion(sentence, last_nounphrase)
#                 phrases.append(nounphrase_string)
#
#             longest_phrase =  sorted(phrases, key=len,reverse= True)
#             if len(longest_phrase) == 2:
#                 first_sent_len = len(longest_phrase[0].split())
#                 second_sentence_len = len(longest_phrase[1].split())
#                 if (first_sent_len - second_sentence_len) > 4:
#                     del longest_phrase[1]
#
#             if len(longest_phrase) > 0:
#                 sentence_completion_dict[sentence] = longest_phrase
#         return sentence_completion_dict
#
#     def sort_by_similarity(original_sentence, generated_sentences_list):
#         sentence_embeddings = model_BERT.encode(generated_sentences_list)
#         queries = [original_sentence]
#         query_embeddings = model_BERT.encode(queries)
#         number_top_matches = len(generated_sentences_list)
#         dissimilar_sentences = []
#
#         for query, query_embedding in zip(queries, query_embeddings):
#             distances = scipy.spatial.distance.cdist([query_embedding], sentence_embeddings, "cosine")[0]
#             results = zip(range(len(distances)), distances)
#             results = sorted(results, key=lambda x: x[1])
#
#             for idx, distance in reversed(results[0:number_top_matches]):
#                 score = 1 - distance
#                 if score < 0.9:
#                     dissimilar_sentences.append(generated_sentences_list[idx].strip())
#
#         sorted_dissimilar_sentences = sorted(dissimilar_sentences, key=len)
#         return sorted_dissimilar_sentences[:3]
#
#     def generate_sentences(partial_sentence, full_sentence):
#         input_ids = torch.tensor([tokenizer.encode(partial_sentence)])
#         maximum_length = len(partial_sentence.split()) + 80
#
#         sample_outputs = model.generate(
#             input_ids,
#             do_sample=True,
#             max_length=maximum_length,
#             top_p=0.90,
#             top_k=50,
#             repetition_penalty=10.0,
#             num_return_sequences=10
#         )
#         generated_sentences=[]
#
#         for i, sample_output in enumerate(sample_outputs):
#             decoded_sentences = tokenizer.decode(sample_output, skip_special_tokens=True)
#             decoded_sentences_list = tokenize.sent_tokenize(decoded_sentences)
#             generated_sentences.append(decoded_sentences_list[0])
#
#         top_3_sentences = sort_by_similarity(full_sentence, generated_sentences)
#         return top_3_sentences
#
#     def store(sent_completion_dict):
#         index = 1
#         results = []
#
#         for key_sentence in sent_completion_dict:
#             false_sentences = []
#             partial_sentences = sent_completion_dict[key_sentence]
#             temp = {"sentence": partial_sentences[0], "false_sentences": []}
#
#             for partial_sent in partial_sentences:
#                 false_sents = generate_sentences(partial_sent, key_sentence)
#                 false_sentences.extend(false_sents)
#
#             temp = {"sentence": partial_sentences[0], "false_sentences": false_sentences}
#             results.append(temp)
#         json_object = json.dumps(results, indent=4)
#         print(json_object)
#         return json_object
#
#     # Load GPT-2 and BERT models
#     tokenizer = GPT2Tokenizer.from_pretrained("gpt2")
#     model = GPT2LMHeadModel.from_pretrained("gpt2", pad_token_id=tokenizer.eos_token_id)
#     model_BERT = SentenceTransformer('bert-base-nli-mean-tokens')
#
#     # Read text from the file
#     text = read_file(x)
#
#     # Extract candidate sentences and preprocess them
#     cand_sent = get_candidate_sents(text)
#     filter_quotes_and_questions = preprocess(cand_sent)
#
#     # Get sentence completions
#     sent_completion_dict = get_sentence_completions(filter_quotes_and_questions)
#     return (store(sent_completion_dict))
#
#     # Store the results in JSON format
#
#
#
# file_path = "text.txt"