
# Apply grid search to find best parameters
# # Parameters to search
# n_neighbors = [5, 10, 15, 20, 25, 50, 100, 250, 500, 1000]
# min_dist = [0.0, 0.1, 0.2, 0.3, 0.4, 0.5]
# min_cluster_size = [5, 10, 15, 20, 25, 50, 100, 250, 500, 1000]
# min_samples= [5, 10, 15, 20, 25, 50, 100, 250, 500, 1000]
from umap import UMAP
from hdbscan import HDBSCAN
from sklearn.feature_extraction.text import TfidfVectorizer
from bertopic import BERTopic
from sentence_transformers import SentenceTransformer


# function for grid search to feed into multiprocessing
def apply_bert_topic(grid, recipe_sentences, embeded_sentences):
    print(grid)
    umap = UMAP(n_neighbors=grid['n_neighbors'], n_components=grid['n_components'], min_dist=grid['min_dist'], metric='cosine')
    hdbscan = HDBSCAN(min_cluster_size=grid['min_cluster_size'], min_samples=grid['min_samples'], metric='euclidean', cluster_selection_method='eom')
    vectorizer = TfidfVectorizer(stop_words='english', lowercase=True)
    embedding_model = SentenceTransformer('bert-base-nli-mean-tokens')

    topic_model = BERTopic(
        language='english',
        top_n_words=10,
        embedding_model=embedding_model, 
        umap_model=umap, 
        hdbscan_model=hdbscan, 
        vectorizer_model=vectorizer,
        verbose=True,
        )

    topics, _ = topic_model.fit_transform(documents=recipe_sentences, embeddings=embeded_sentences)
    print('Done with grid search', grid)

    return grid, topic_model.get_topic_freq()
