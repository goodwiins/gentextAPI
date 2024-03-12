from services.True_Flase_gen.prep import run_program



def test_test():
    return "testing test service"

def len_of_text(text):
    response = {"length":len(text),
                
                "text":text
    }
    return response

def nlp_test(x):
    return run_program(x)