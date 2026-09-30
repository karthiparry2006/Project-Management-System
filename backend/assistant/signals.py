from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from tasks.models import Task, TaskComment
from .services.vector_store import get_vector_store

@receiver(post_save, sender=Task)
def on_task_saved(sender, instance, created, **kwargs):
    try:
        store = get_vector_store()
        store.upsert_task(instance)
    except Exception as e:
        print(f"[Signal] Error indexing task #{instance.id}: {e}")

@receiver(post_delete, sender=Task)
def on_task_deleted(sender, instance, **kwargs):
    try:
        store = get_vector_store()
        store.delete_task(instance.id)
    except Exception as e:
        print(f"[Signal] Error removing task #{instance.id} from index: {e}")

@receiver(post_save, sender=TaskComment)
def on_comment_saved(sender, instance, created, **kwargs):
    try:
        store = get_vector_store()
        store.upsert_task(instance.task)
    except Exception as e:
        print(f"[Signal] Error indexing task comments for task #{instance.task.id}: {e}")
