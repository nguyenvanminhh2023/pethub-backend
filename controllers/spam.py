import pickle
import re
from tensorflow import keras
import sys

def replace_url(text, replacement):
  text = str(text)
  text = re.sub('http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\(\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+', replacement, text)
  text = re.sub('[/]?watch(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\(\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+', replacement, text)
  return text
def remove_encoding(text):
  text = str(text)
  text = text.replace('\ufeff', '')
  return text

vect = pickle.load(open('transformer.h5', 'rb'))
model = keras.models.load_model('model_review.h5')
def classification(review: str):
  review = review.lower()
  review = replace_url(review, 'http')
  review = remove_encoding(review)
  review = review.split()
  review = ' '.join(review)
  X = [review]
  X_test = vect.transform(X).toarray()
  predict = model.predict(X_test, verbose = 0)[0]
  return predict
review = 'vãi'
result = classification(sys.argv[1])[0]
if result > 0.5:
  print('isBad')
else:
  print('isNotBad')
