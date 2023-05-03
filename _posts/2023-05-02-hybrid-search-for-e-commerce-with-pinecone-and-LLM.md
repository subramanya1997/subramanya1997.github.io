---
layout: post
title: Hybrid Search for E-Commerce with Pinecone and LLMs
excerpt: Learn how to build a powerful hybrid search system for e-commerce applications by combining traditional information retrieval methods with machine learning models like Language Models (LLMs) and Pinecone, a managed vector database. Discover the benefits of hybrid search for e-commerce, including improved search relevance, personalization, handling long-tail queries, and simpler infrastructure management.
author: Subramanya N
date: 2023-05-02
tags: [Pinecone, Hybrid Search, E-Commerce, Large Language Models, Vector Database]
image: /assets/images/pinecone_hybrid_index.jpg
ready: true
---

Searching and finding relevant products is a critical component of an e-commerce website. Providing fast and accurate search results can make the difference between high user satisfaction and user frustration. With recent advancements in natural language understanding and vector search technologies, enhanced search systems have become more accessible and efficient, leading to better user experiences and improved conversion rates.

In this blog post, we'll explore how to implement a hybrid search system for e-commerce using Pinecone, a high-performance vector search engine, and fine-tuned domain-specific language models. By the end of this post, you'll not only have a strong understanding of hybrid search but also a practical step-by-step guide to implementing it.

## What is Hybrid Search?

![Pinecone Hybrid Index](/assets/images/pinecone_hybrid_index.jpg){:.post-img}
<span class="post-img-caption">High-level view of simple Pinecone Hybrid Index</span>


Before diving into the implementation, let's quickly understand what hybrid search means. Hybrid search is an approach that combines the strengths of both traditional search (sparse vector search) and vector search (dense vector search) to achieve better search performance across a wide range of domains.

Dense vector search extracts high-quality vector embeddings from text data and performs a similarity search to find relevant documents. However, it often struggles with out-of-domain data when it's not fine-tuned on domain-specific datasets.

On the other hand, traditional search uses sparse vector representations, like term frequency-inverse document frequency (TF-IDF) or BM25, and does not require any domain-specific fine-tuning. While it can handle new domains, its performance is limited by its inability to understand semantic relations between words and lacks the intelligence of dense retrieval.

Hybrid search tries to mitigate the weaknesses of both approaches by combining them in a single system, leveraging the performance potential of dense vector search and the zero-shot adaptability of traditional search.

Now that we have a basic understanding of hybrid search, let's dive into its implementation.

## Building a Hybrid Search System

We'll cover the following steps for implementing a hybrid search system:

1. Leveraging Domain-Specific Language Models
2. Creating Sparse and Dense Vectors
3. Setting Up Pinecone
4. Implementing the Hybrid Search Pipeline
5. Making Queries and Tuning Parameters

### 1. Leveraging Domain-Specific Language Models

In recent years, large-scale pre-trained language models like OpenAI's GPT and Cohere have become increasingly popular for a variety of tasks, including natural language understanding and generation. These models can be fine-tuned on domain-specific data to improve their performance and adapt to specific tasks, such as e-commerce product search.

In our example, we will use a fine-tuned domain-specific language model to generate dense vector embeddings for products and queries. However, you can choose other models or even create your own custom embeddings based on your specific domain.

```python
import torch
from transformers import AutoTokenizer, AutoModel

# Load a pre-trained domain-specific language model
model_name = "your-domain-specific-model"
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModel.from_pretrained(model_name)

# Generate dense vector embeddings for a product description
text = "Nike Air Max sports shoes for men"
inputs = tokenizer(text, return_tensors="pt")
with torch.no_grad():
    outputs = model(**inputs)
    dense_embedding = outputs.last_hidden_state.mean(dim=1).numpy()
```

### 2. Creating Sparse and Dense Vectors

Hybrid search requires both sparse and dense vector representations for our e-commerce data. We'll now describe how to generate these vectors.

#### Sparse Vectors

Sparse vector representations, like TF-IDF or BM25, can be created using standard text processing techniques, such as tokenization, stopword removal, and stemming. An example of generating sparse vectors can be achieved using a vocabulary matrix.

```python
# This function generates sparse vector representations of a list of product descriptions
def generate_sparse_vectors(text):
    '''Generates sparse vector representations for a list of product descriptions

    Args:
        text (list): A list of product descriptions

    Returns:
        sparse_vector (dict): A dictionary of indices and values
    '''
    sparse_vector = bm25.encode_queries(text)
    return sparse_vector

from pinecone_text.sparse import BM25Encoder

# Create the BM25 encoder and fit the data
bm25 = BM25Encoder()
bm25.fit(new_df.full_data)

# Create the sparse vectors
sparse_vectors = []
for product_description in product_descriptions:
    sparse_vectors.append(generate_sparse_vectors(text=product_description))
```

#### Dense Vectors

Dense vector representations can be generated using pre-trained or custom domain-specific language models. In our previous example, we used a domain-specific language model to generate dense vector embeddings for a product description.

```python
def generate_dense_vector(text):
    '''Generates dense vector embeddings for a list of product descriptions

    Args:
        text (list): A list of product descriptions

    Returns:
        dense_embedding (np.array): A numpy array of dense vector embeddings
    '''
    # Tokenize the text and convert to PyTorch tensors
    inputs = tokenizer(text, return_tensors="pt")
    # Generate the embeddings with the pre-trained model
    with torch.no_grad():
        outputs = model(**inputs)
        dense_vector = outputs.last_hidden_state.mean(dim=1).numpy()
    return dense_vector

# Generate dense vector embeddings for a list of product descriptions
dense_vectors = []
for product_description in product_descriptions:
    dense_vectors.append(generate_dense_vector(text=product_description))
```

### 3. Setting Up Pinecone

Pinecone is a high-performance vector search engine that supports hybrid search. It enables the creation of a single index for both sparse and dense vectors and seamlessly handles search queries across different data modalities.

To use Pinecone, you'll need to sign up for an account, install the Pinecone client, and set up your API key and environment.

```python
# Create a Pinecone hybrid search index
import pinecone

pinecone.init(
    api_key="YOUR_API_KEY",  # app.pinecone.io
    environment="YOUR_ENV"  # find next to api key in console
)

# Create a Pinecone hybrid search index
index_name = "ecommerce-hybrid-search"
pinecone.create_index(
    index_name = index_name,
    dimension = MODEL_DIMENSION,  # dimensionality of dense model
    metric = "dotproduct"
)
# connect to the index
index = pinecone.Index(index_name=index_name)
# view index stats
index.describe_index_stats()
```

### 4. Implementing the Hybrid Search Pipeline

With our sparse and dense vectors generated and Pinecone set up, we can now build a hybrid search pipeline. This pipeline includes the following steps:

1. Adding product data to the Pinecone index
2. Retrieving results using both sparse and dense vectors

```python
def add_product_data_to_index(product_ids, sparse_vectors, dense_vectors, metadata=None):
    """Upserts product data to the Pinecone index.

    Args:
        product_ids (`list` of `str`): Product IDs.
        sparse_vectors (`list` of `list` of `float`): Sparse vectors.
        dense_vectors (`list` of `list` of `float`): Dense vectors.
        metadata (`list` of `list` of `str`): Optional metadata.

    Returns:
        None
    """
    batch_size = 32

    # Loop through the product IDs in batches.
    for i in range(0, len(product_ids), batch_size):
        i_end = min(i + batch_size, len(product_ids))
        ids = product_ids[i:i_end]
        sparse_batch = sparse_vectors[i:i_end]
        dense_batch = dense_vectors[i:i_end]
        meta_batch = metadata[i:i_end] if metadata else []

        vectors = []
        for _id, sparse, dense, meta in zip(ids, sparse_batch, dense_batch, meta_batch):
            vectors.append({
                'id': _id,
                'sparse_values': sparse,
                'values': dense,
                'metadata': meta
            })

        # Upsert the vectors into the Pinecone index.
        index.upsert(vectors=vectors)

add_product_data_to_index(product_ids, sparse_vectors, dense_vectors)
```

Now that our data is indexed, we can perform hybrid search queries.

### 5. Making Queries and Tuning Parameters

![Pinecone Hybrid Query](/assets/images/pinecone_hybrid_query.jpg){:.post-img}
<span class="post-img-caption">High-level view of simple Pinecone Hybrid Query</span>

To make hybrid search queries, we'll create a function that takes a query, the number of top results, and an alpha parameter to control the weighting between dense and sparse vector search scores.

```python
def hybrid_scale(dense, sparse, alpha: float):
    """Hybrid vector scaling using a convex combination

    alpha * dense + (1 - alpha) * sparse

    Args:
        dense: Array of floats representing
        sparse: a dict of `indices` and `values`
        alpha: float between 0 and 1 where 0 == sparse only
               and 1 == dense only
    """
    if alpha < 0 or alpha > 1:
        raise ValueError("Alpha must be between 0 and 1")
    # scale sparse and dense vectors to create hybrid search vecs
    hsparse = {
        'indices': sparse['indices'],
        'values':  [v * (1 - alpha) for v in sparse['values']]
    }
    hdense = [v * alpha for v in dense]
    return hdense, hsparse

def search_products(query, top_k=10, alpha=0.5):
    # Generate sparse query vector
    sparse_query_vector = generate_sparse_vector(query)

    # Generate dense query vector
    dense_query_vector = generate_dense_vector(query)

    # Calculate hybrid query vector
    dense_query_vector, sparse_query_vector = hybrid_scale(dense_query_vector, sparse_query_vector, alpha)

    # Search products using Pinecone
    results = index.query(
        vector=dense_query_vector,
        sparse_vector=sparse_query_vector,
        top_k=top_k
    )

    return results
```

We can then use this function to search for relevant products in our e-commerce dataset.

```python
query = "running shoes for women"
results = search_products(query, top_k=5)

for result in results:
    print(result['id'], result['metadata']['product_name'], result['score'])
```

Experimenting with different values for the alpha parameter will help you find the optimal balance between sparse and dense vector search for your specific domain.

## Conclusion

In this blog post, we demonstrated how to build a hybrid search system for e-commerce using Pinecone and domain-specific language models. Hybrid search enables us to combine the strengths of both traditional search and vector search, improving search performance and adaptability across diverse domains.

By following the steps and code snippets provided in this post, you can implement your own hybrid search system tailored to your e-commerce website's specific requirements. Start exploring Pinecone and improve your e-commerce search experience today!

## References

- [Ecommerce Search using Hybrid Search Techniques in Pinecone (Google Colab Notebook)](https://colab.research.google.com/github/pinecone-io/examples/blob/master/search/hybrid-search/ecommerce-search/ecommerce-search.ipynb): A practical guide showcasing the implementation of e-commerce search using Pinecone's hybrid search techniques.
- [Pinecone Ecommerce Search Documentation](https://docs.pinecone.io/docs/ecommerce-search): Official Pinecone documentation for building e-commerce search systems.
- [BM25 Vector Generation using Pinecone (Google Colab Notebook)](https://colab.research.google.com/github/pinecone-io/examples/blob/master/pinecone/sparse/bm25/bm25-vector-generation.ipynb): A guide for generating BM25 sparse vectors using Pinecone.
- [Pinecone Text Repository on GitHub](https://github.com/pinecone-io/pinecone-text): A collection of text processing and vector generation resources using Pinecone.
- [Introduction to Hybrid Search on Pinecone's Website](https://www.pinecone.io/learn/hybrid-search-intro/): An overview of hybrid search, its benefits, and use cases in the context of pinecone's capabilities.