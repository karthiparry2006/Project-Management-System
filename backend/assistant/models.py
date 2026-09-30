from django.db import models
from django.conf import settings
from projects.models import Project

class ChatMessage(models.Model):
    SENDER_CHOICES = (
        ('user', 'user'),
        ('assistant', 'assistant'),
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='chat_messages'
    )
    project = models.ForeignKey(
        Project,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='chat_messages'
    )
    session_id = models.CharField(max_length=100, default='default')
    sender = models.CharField(max_length=20, choices=SENDER_CHOICES)
    content = models.TextField()
    structured_action_json = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"[{self.sender}] {self.user.username}: {self.content[:40]}"
