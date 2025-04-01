from flask import Flask, request, jsonify
import joblib
import pandas as pd

# Initialize Flask app
app = Flask(__name__)

# Load saved data
df_articles = pd.read_csv("shared_articles.csv")  
cosine_sim = joblib.load("cosine_similarity_matrix.sav")
tfidf_vectorizer = joblib.load("tfidf_vectorizer.sav")

# Recommendation function
def get_recommendations(contentId, sim_matrix, n=10):
    sim_scores = list(enumerate(sim_matrix[contentId]))
    sim_scores = sorted(sim_scores, key=lambda x: x[1], reverse=True)
    top_similar = sim_scores[1:n+1]
    rec_dict = {i[0]: i[1] for i in top_similar}
    return rec_dict

@app.route('/recommend', methods=['GET'])
def recommend():
    title = request.args.get('title')

    if title not in df_articles['title'].to_list():
        return jsonify({"error": f"'{title}' not found in dataset."}), 404

    content_id = df_articles.index[df_articles['title'] == title][0]
    rec_dict = get_recommendations(content_id, cosine_sim, n=10)

    recommendations = df_articles.loc[df_articles.index.isin(rec_dict.keys()), ['title']]
    recommendations['similarity'] = recommendations.index.map(rec_dict)

    return jsonify(recommendations.sort_values(by='similarity', ascending=False).to_dict(orient='records'))

# Run the app
if __name__ == '__main__':
    app.run(debug=True)
