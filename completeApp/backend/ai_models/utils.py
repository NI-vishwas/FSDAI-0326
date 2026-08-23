import pickle
import os
from sklearn.feature_extraction.text import TfidfVectorizer

PICKLE_PATH = '/home/vishwas/Workspace/temp/NUS-FSD-AI-0625/completeApp/ai_models/saved_models/'

def is_spam(test_message):
    if os.path.exists(PICKLE_PATH):
        with open(PICKLE_PATH+'logistic_regression.pkl','rb') as fh:
            model = pickle.load(fh)

        with open(PICKLE_PATH+'feature_extraction.pkl','rb') as fhandle:
            loaded_vectorizer = pickle.load(fhandle)
        
        
        input_data_features = loaded_vectorizer.transform([test_message])

        prediction = model.predict(input_data_features)
        print(f"Message: {test_message}")
        print(f"Predicted Output: {prediction}")
        if prediction[0] == 0:
            #print("Ham mail")
            #return "Ham mail"
            return False
        else:
            # print("Spam Mail")
            # return "Spam Mail"
            return True

if __name__ == '__main__':
    test_message = "FreeMsg Hey there darling it's been 3 week's now and no word back! I'd like some fun you up for it still? Tb ok! XxX std chgs to send, £1.50 to rcv"
    if is_spam(test_message):
        print("SPAM")
    else:
        print("NOT SPAM")