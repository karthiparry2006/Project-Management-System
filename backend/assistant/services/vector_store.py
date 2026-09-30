import os
import json
import numpy as np
from pathlib import Path
from django.conf import settings

INDEX_DIR = Path(getattr(settings, 'VECTOR_STORE_DIR', Path(__file__).resolve().parent.parent / 'vector_store_data'))
INDEX_METADATA_FILE = INDEX_DIR / 'index_metadata.json'
FAISS_INDEX_FILE = INDEX_DIR / 'pms.index'

_model = None
_model_failed = False

def get_embedding_model():
    global _model, _model_failed
    if _model is not None:
        return _model
    if _model_failed:
        return None
    try:
        from sentence_transformers import SentenceTransformer
        _model = SentenceTransformer('all-MiniLM-L6-v2')
        return _model
    except Exception as e:
        print(f"[VectorStore] SentenceTransformer init fallback: {e}")
        _model_failed = True
        return None

def compute_fallback_embedding(text, dim=384):
    """
    Deterministic dense feature vector for offline/fallback environments.
    """
    import hashlib
    words = text.lower().split()
    vec = np.zeros(dim, dtype=np.float32)
    for word in words:
        h = int(hashlib.md5(word.encode('utf-8')).hexdigest(), 16)
        idx = h % dim
        sign = 1.0 if (h // dim) % 2 == 0 else -1.0
        vec[idx] += sign
    norm = np.linalg.norm(vec)
    if norm > 1e-6:
        vec = vec / norm
    return vec

def get_text_embedding(text: str) -> np.ndarray:
    model = get_embedding_model()
    if model is not None:
        try:
            emb = model.encode(text, convert_to_numpy=True)
            norm = np.linalg.norm(emb)
            if norm > 1e-6:
                emb = emb / norm
            return emb.astype(np.float32)
        except Exception:
            pass
    return compute_fallback_embedding(text)

class VectorStore:
    def __init__(self):
        INDEX_DIR.mkdir(parents=True, exist_ok=True)
        self.documents = []  # list of { "id": str, "text": str, "metadata": dict }
        self.vectors = []    # list of np.ndarray
        self.load()

    def load(self):
        if INDEX_METADATA_FILE.exists():
            try:
                with open(INDEX_METADATA_FILE, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    self.documents = data.get('documents', [])
                vec_file = INDEX_DIR / 'vectors.npy'
                if vec_file.exists() and len(self.documents) > 0:
                    loaded = np.load(vec_file)
                    if len(loaded) == len(self.documents):
                        self.vectors = [v for v in loaded]
                    else:
                        self.rebuild_vectors()
                else:
                    self.rebuild_vectors()
            except Exception as e:
                print(f"[VectorStore] Load failed: {e}")
                self.documents = []
                self.vectors = []

    def save(self):
        try:
            with open(INDEX_METADATA_FILE, 'w', encoding='utf-8') as f:
                json.dump({'documents': self.documents}, f, ensure_ascii=False, indent=2)
            if self.vectors:
                vec_matrix = np.vstack(self.vectors).astype(np.float32)
                np.save(INDEX_DIR / 'vectors.npy', vec_matrix)
        except Exception as e:
            print(f"[VectorStore] Save failed: {e}")

    def rebuild_vectors(self):
        self.vectors = []
        for doc in self.documents:
            vec = get_text_embedding(doc['text'])
            self.vectors.append(vec)
        self.save()

    def upsert_task(self, task):
        from tasks.models import Task
        comments = task.comments.all()
        comments_str = "\n".join([f"  - {c.author.username}: {c.message}" for c in comments])
        assignee_name = task.assignee.username if task.assignee else 'Unassigned'

        doc_text = (
            f"[Task #{task.id}] Title: {task.title}\n"
            f"Project: {task.project.name} (ID: {task.project.id})\n"
            f"Status: {task.status} | Priority: {task.priority} | Assignee: {assignee_name} | Due Date: {task.due_date}\n"
            f"Description: {task.description or 'No description provided.'}\n"
            f"Comments / Discussions:\n{comments_str if comments_str else '  No comments yet.'}"
        )

        doc_id = f"task_{task.id}"
        metadata = {
            "task_id": task.id,
            "project_id": task.project.id,
            "project_name": task.project.name,
            "title": task.title,
            "status": task.status,
            "priority": task.priority,
            "assignee": assignee_name,
            "due_date": str(task.due_date) if task.due_date else None,
            "type": "task"
        }

        # Check existing
        existing_idx = next((i for i, d in enumerate(self.documents) if d['id'] == doc_id), None)
        vec = get_text_embedding(doc_text)

        if existing_idx is not None:
            self.documents[existing_idx] = {"id": doc_id, "text": doc_text, "metadata": metadata}
            self.vectors[existing_idx] = vec
        else:
            self.documents.append({"id": doc_id, "text": doc_text, "metadata": metadata})
            self.vectors.append(vec)

        self.save()

    def delete_task(self, task_id):
        doc_id = f"task_{task_id}"
        idx = next((i for i, d in enumerate(self.documents) if d['id'] == doc_id), None)
        if idx is not None:
            self.documents.pop(idx)
            self.vectors.pop(idx)
            self.save()

    def query(self, query_text: str, project_id: int = None, top_k: int = 4):
        if not self.documents or not self.vectors:
            return []

        query_vec = get_text_embedding(query_text)
        scores = []
        for i, doc in enumerate(self.documents):
            # Filter by project if supplied
            if project_id and doc['metadata'].get('project_id') != project_id:
                continue

            doc_vec = self.vectors[i]
            # Cosine similarity
            score = float(np.dot(query_vec, doc_vec))
            
            # Simple keyword bonus for exact token overlap
            q_tokens = set(query_text.lower().split())
            d_tokens = set(doc['text'].lower().split())
            overlap = len(q_tokens.intersection(d_tokens)) / max(len(q_tokens), 1)
            final_score = score + (overlap * 0.3)

            scores.append((final_score, doc))

        scores.sort(key=lambda x: x[0], reverse=True)
        return [doc for _, doc in scores[:top_k]]

    def reindex_all(self):
        from tasks.models import Task
        self.documents = []
        self.vectors = []
        tasks = Task.objects.all().select_related('project', 'assignee').prefetch_related('comments__author')
        for task in tasks:
            self.upsert_task(task)
        print(f"[VectorStore] Indexed {len(self.documents)} tasks successfully.")

_store = None

def get_vector_store():
    global _store
    if _store is None:
        _store = VectorStore()
    return _store
